import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    link: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ externalId: 1, sourceUrl: 1 }, { unique: true });

export const Job = mongoose.model('Job', jobSchema);
