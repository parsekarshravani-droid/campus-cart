import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDemoData } from './seedData.js';

const reset = process.argv.includes('--reset');

try {
  const { mode } = await connectDB();
  if (mode === 'memory') {
    console.warn('[seed] MONGO_URI is not set: seeding a temporary in-memory database that vanishes on exit.');
    console.warn('[seed] Set MONGO_URI (MongoDB Atlas) to seed persistent data.');
  }
  await seedDemoData({ reset });
} catch (error) {
  console.error('[seed] Failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
