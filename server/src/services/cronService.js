import cron from 'node-cron';
import { config } from '../config/index.js';
import { JobSource } from '../models/JobSource.js';
import { fetchJobsFromUrl } from './fetchService.js';
import { addImportJob } from './queueService.js';

export function startCron(onTick) {
  cron.schedule(config.cron.schedule, async () => {
    try {
      await onTick();
    } catch (err) {
      console.error('Cron tick error:', err);
    }
  });
  console.log('Cron scheduled:', config.cron.schedule);
}

export async function runFetchAndQueue() {
  const { connectDb } = await import('../db.js');
  await connectDb();

  const sources = await JobSource.find({ enabled: true }).lean();
  for (const src of sources) {
    try {
      const jobs = await fetchJobsFromUrl(src.url);
      if (jobs.length) await addImportJob(src.url, jobs);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Redis')) {
        console.warn('Redis not running – skip queueing. Start Redis to use the job queue.');
        break;
      }
      console.error(`Fetch failed for ${src.url}:`, err.message);
    }
  }
}
