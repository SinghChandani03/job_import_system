import mongoose from 'mongoose';

const jobSourceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    lastFetchedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const JobSource = mongoose.model('JobSource', jobSourceSchema);
