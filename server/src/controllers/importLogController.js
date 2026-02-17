import { getImportLogs } from '../services/importLogService.js';

export async function list(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const sourceUrl = req.query.sourceUrl || undefined;

  const { logs, total, page: p, limit: l } = await getImportLogs({ page, limit, sourceUrl });

  res.json({
    logs,
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
  });
}
