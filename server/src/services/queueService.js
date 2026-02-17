import { Queue } from 'bullmq';
import { config } from '../config/index.js';

const useTls = config.redis.tls;
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  ...(config.redis.host.includes('redislabs.com') && { username: 'default' }),
  ...(useTls && { tls: { rejectUnauthorized: false } }),
};

let jobImportQueue = null;
let queueError = null;

function getQueue() {
  if (queueError) return { queue: null, error: queueError };
  if (jobImportQueue) return { queue: jobImportQueue, error: null };
  try {
    jobImportQueue = new Queue(config.queue.name, {
      connection,
      defaultJobOptions: {
        attempts: config.queue.attempts,
        backoff: config.queue.backoff,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
    return { queue: jobImportQueue, error: null };
  } catch (err) {
    queueError = err;
    return { queue: null, error: err };
  }
}

async function cleanOldJobs(queue) {
  const grace = 60 * 1000; // 1 minute
  const limit = 500;
  try {
    await Promise.all([
      queue.clean(grace, limit, 'completed'),
      queue.clean(grace, limit, 'failed'),
    ]);
  } catch {
    // ignore cleanup errors
  }
}

export async function addImportJob(sourceUrl, jobs) {
  const { queue, error } = getQueue();
  if (error) throw error;
  if (!queue) throw new Error('Queue not available');
  await cleanOldJobs(queue);

  const chunkSize = config.queue.jobsPerQueueJob;
  const jobList = Array.isArray(jobs) ? jobs : [];
  const totalJobs = jobList.length;
  if (totalJobs === 0) {
    return { firstJobId: null, chunkCount: 0, totalJobs: 0 };
  }

  const runId = `${sourceUrl}|${Date.now()}`;
  let firstJobId = null;

  try {
    if (totalJobs <= chunkSize) {
      const job = await queue.add('import', { sourceUrl, jobs: jobList, runId }, { priority: 1 });
      firstJobId = job.id;
      return { firstJobId, chunkCount: 1, totalJobs };
    }

    for (let i = 0; i < jobList.length; i += chunkSize) {
      const chunk = jobList.slice(i, i + chunkSize);
      const chunkIndex = Math.floor(i / chunkSize);
      const totalChunks = Math.ceil(jobList.length / chunkSize);
      const added = await queue.add(
        'import',
        { sourceUrl, jobs: chunk, runId, chunkIndex, totalChunks },
        { priority: 1 }
      );
      if (firstJobId === null) firstJobId = added.id;
    }
    const chunkCount = Math.ceil(totalJobs / chunkSize);
    return { firstJobId, chunkCount, totalJobs };
  } catch (err) {
    queueError = err;
    jobImportQueue = null;
    throw err;
  }
}

export function isQueueAvailable() {
  const { queue, error } = getQueue();
  return !!queue && !error;
}
