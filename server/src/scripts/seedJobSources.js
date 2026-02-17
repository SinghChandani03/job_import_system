import { connectDb } from '../db.js';
import { JobSource } from '../models/JobSource.js';

const DEFAULT_SOURCES = [
  { url: 'https://jobicy.com/?feed=job_feed', name: 'Jobicy – All' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time', name: 'Jobicy – SMM, full-time' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france', name: 'Jobicy – Seller, France' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia', name: 'Jobicy – Design & multimedia' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=data-science', name: 'Jobicy – Data science' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=copywriting', name: 'Jobicy – Copywriting' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=business', name: 'Jobicy – Business' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=management', name: 'Jobicy – Management' },
  { url: 'https://www.higheredjobs.com/rss/articleFeed.cfm', name: 'HigherEdJobs' },
];

async function seed() {
  await connectDb();
  for (const { url, name } of DEFAULT_SOURCES) {
    await JobSource.updateOne(
      { url },
      { $set: { name }, $setOnInsert: { url, enabled: true } },
      { upsert: true }
    );
  }
  console.log('Seeded', DEFAULT_SOURCES.length, 'job sources');
  process.exit(0);
}

seed().catch((e) => {
  const isConnectionError =
    e?.name === 'MongooseServerSelectionError' ||
    e?.code === 'ECONNREFUSED' ||
    /ECONNREFUSED|connect ECONNREFUSED/i.test(String(e?.message ?? e));
  if (isConnectionError) {
    console.error('Could not connect to MongoDB. Is MongoDB running?');
    console.error('  - Start MongoDB locally, or');
    console.error('  - Set MONGO_URI in a .env file (e.g. MongoDB Atlas connection string).');
  }
  console.error(e);
  process.exit(1);
});
