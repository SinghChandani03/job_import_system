import mongoose from "mongoose";

const failureReasonSchema = new mongoose.Schema(
  {
    jobId: { type: String },
    reason: { type: String },
    code: { type: String },
  },
  { _id: false },
);

const importLogSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true },
    runId: { type: String },
    chunkIndex: { type: Number },
    totalChunks: { type: Number },
    timestamp: { type: Date, default: Date.now },
    totalFetched: { type: Number, default: 0 },
    totalImported: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    failureReasons: [failureReasonSchema],
  },
  { timestamps: true },
);

importLogSchema.index({ timestamp: -1 });
importLogSchema.index({ sourceUrl: 1, timestamp: -1 });

export const ImportLog = mongoose.model("ImportLog", importLogSchema);
