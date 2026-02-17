import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDb } from './db.js';
import { startCron, runFetchAndQueue } from './services/cronService.js';
import jobSourcesRouter from './routes/jobSources.js';
import importLogsRouter from './routes/importLogs.js';
import { errorHandler } from './middlewares/errorHandler.js';

await connectDb();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/job-sources', jobSourcesRouter);
app.use('/api/import-logs', importLogsRouter);

app.use(errorHandler);

// Connect DB
await connectDb();

// Start cron ONLY in local (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  startCron(runFetchAndQueue);

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

// Export for Vercel
export default serverless(app);
