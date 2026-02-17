import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/job-import',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === '1' || process.env.REDIS_TLS === 'true',
  },
  queue: {
    name: 'job-import',
    jobsPerQueueJob: parseInt(process.env.QUEUE_JOBS_PER_JOB || '25000', 10),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    batchSize: parseInt(process.env.IMPORT_BATCH_SIZE || '500', 10),
    maxFailureReasonsToStore: parseInt(process.env.IMPORT_MAX_FAILURE_REASONS || '500', 10),
    attempts: parseInt(process.env.JOB_ATTEMPTS || '3', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.BACKOFF_DELAY_MS || '2000', 10),
    },
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 * * * *', // every hour
  },
};
