import { Job } from '../models/Job.js';
import { config } from '../config/index.js';

const BATCH_SIZE = config.queue.batchSize;
const MAX_FAIL = config.queue.maxFailureReasonsToStore;

function toUpdate(p) {
  return {
    title: p.title ?? '',
    description: p.description ?? '',
    company: p.company ?? '',
    location: p.location ?? '',
    link: p.link ?? '',
    publishedAt: p.publishedAt ?? null,
    raw: p.raw,
    updatedAt: new Date(),
  };
}

async function writeChunk(jobs) {
  if (!jobs.length) return { newJobs: 0, updatedJobs: 0, failedJobs: 0, failureReasons: [] };
  const ops = jobs.map((p) => ({
    updateOne: {
      filter: { externalId: String(p.externalId), sourceUrl: String(p.sourceUrl) },
      update: { $set: toUpdate(p) },
      upsert: true,
    },
  }));
  const res = await Job.bulkWrite(ops, { ordered: false });
  const writeErrors = res.writeErrors ?? [];
  const failureReasons = writeErrors.slice(0, MAX_FAIL).map((e) => ({
    jobId: jobs[e.index]?.externalId ?? null,
    reason: e.err?.message ?? 'Write error',
    code: e.err?.code ?? e.err?.name ?? null,
  }));
  return {
    newJobs: res.upsertedCount ?? 0,
    updatedJobs: res.modifiedCount ?? 0,
    failedJobs: writeErrors.length,
    failureReasons,
  };
}

export async function upsertBatch(jobs) {
  let newCount = 0, updatedCount = 0, failedCount = 0;
  const failureReasons = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const chunk = jobs.slice(i, i + BATCH_SIZE);
    const r = await writeChunk(chunk);
    newCount += r.newJobs;
    updatedCount += r.updatedJobs;
    failedCount += r.failedJobs;
    if (failureReasons.length < MAX_FAIL) {
      failureReasons.push(...r.failureReasons.slice(0, MAX_FAIL - failureReasons.length));
    }
  }
  return {
    newJobs: newCount,
    updatedJobs: updatedCount,
    failedJobs: failedCount,
    failureReasons,
    totalImported: newCount + updatedCount,
  };
}
