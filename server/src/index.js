import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { config } from "./config/index.js";
import { connectDb } from "./db.js";
import jobSourcesRouter from "./routes/jobSources.js";
import importLogsRouter from "./routes/importLogs.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ensure DB connection
app.use(async (req, res, next) => {
  await connectDb();
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/job-sources", jobSourcesRouter);
app.use("/api/import-logs", importLogsRouter);

app.use(errorHandler);

// Local only
if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

export default serverless(app);
