import mongoose from 'mongoose';
import { config } from './config/index.js';

let connected = false;

export async function connectDb() {
  if (connected) return;
  await mongoose.connect(config.mongoUri);
  connected = true;
}
