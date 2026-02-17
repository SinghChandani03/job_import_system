import { ImportLog } from '../models/ImportLog.js';

export async function createImportLog(entry) {
  return ImportLog.create(entry);
}

export async function getImportLogs(options = {}) {
  const { page = 1, limit = 20, sourceUrl } = options;
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = sourceUrl ? { sourceUrl } : {};
  const [logs, total] = await Promise.all([
    ImportLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    ImportLog.countDocuments(filter),
  ]);
  return { logs, total, page, limit };
}
