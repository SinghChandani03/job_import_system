import { JobSource } from '../models/JobSource.js';
import { fetchJobsFromUrl } from '../services/fetchService.js';
import { addImportJob } from '../services/queueService.js';
import { mapErrorToClientResponse } from '../helpers/apiErrorMapper.js';

export async function list(req, res) {
  const sources = await JobSource.find().sort({ createdAt: -1 }).lean();
  res.json(sources);
}

export async function create(req, res) {
  const { url, name } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }
  const source = await JobSource.create({ url: url.trim(), name: name || '' });
  res.status(201).json(source);
}

export async function trigger(req, res) {
  const source = await JobSource.findById(req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  const jobs = await fetchJobsFromUrl(source.url);
  if (!jobs.length) {
    return res.json({ message: 'No jobs fetched', queued: 0 });
  }
  try {
    const { totalJobs } = await addImportJob(source.url, jobs);
    return res.json({ message: 'Import queued', count: totalJobs });
  } catch (err) {
    const clientError = mapErrorToClientResponse(err);
    if (clientError) {
      return res.status(clientError.status).json({ error: clientError.message });
    }
    throw err;
  }
}
