import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Redis from 'ioredis';
import { Worker } from 'bullmq';
import { config } from './config/index.js';
import { connectDb } from './db.js';
import { upsertBatch } from './services/jobUpsertService.js';
import { createImportLog } from './services/importLogService.js';

const useTls = config.redis.tls;
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  ...(config.redis.host.includes('redislabs.com') && { username: 'default' }),
  ...(useTls && { tls: { rejectUnauthorized: false } }),
  connectTimeout: 10000,
};

// Check Redis before starting the worker – wait for ready, then ping
function checkRedis() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const redis = new Redis({
      ...connection,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (redis.status !== 'ready') {
        redis.quit().catch(() => {});
        reject(new Error('Connection timeout'));
      }
    }, 12000);
    redis.on('error', (err) => {
      if (settled || !redis.status || redis.status === 'end') return;
      settled = true;
      clearTimeout(timeoutId);
      reject(err);
    });
    redis.once('ready', () => {
      redis.ping()
        .then(() => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          redis.quit().catch(() => {});
          resolve();
        })
        .catch((err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          redis.quit().catch(() => {});
          reject(err);
        });
    });
    redis.once('close', () => {
      if (redis.status === 'end' && !settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error('Connection closed (check password and Redis Cloud endpoint)'));
      }
    });
  });
}

checkRedis()
  .then(() => startWorker())
  .catch((err) => {
    console.error('Redis connection failed:', err.message || err);
    console.error('Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in server/.env (no quotes, no spaces).');
    process.exit(1);
  });

function startWorker() {
  const worker = new Worker(
    config.queue.name,
    async (job) => {
      if (job.name !== 'import') return;
      const { sourceUrl, jobs } = job.data;
      const totalFetched = Array.isArray(jobs) ? jobs.length : 0;

      await connectDb();

      const result = await upsertBatch(jobs || []);
      const logEntry = {
        sourceUrl,
        runId: job.data.runId,
        chunkIndex: job.data.chunkIndex,
        totalChunks: job.data.totalChunks,
        totalFetched,
        totalImported: result.totalImported,
        newJobs: result.newJobs,
        updatedJobs: result.updatedJobs,
        failedJobs: result.failedJobs,
        failureReasons: result.failureReasons,
      };
      await createImportLog(logEntry);

      return logEntry;
    },
    {
      connection,
      concurrency: config.queue.concurrency,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err?.message);
  });

  console.log('Worker started, concurrency:', config.queue.concurrency);
}
