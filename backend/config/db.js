import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB.
 * - Uses MONGO_URI when provided (Atlas in every deployed environment).
 * - In development, falls back to a disposable in-memory MongoDB so the
 *   project can be run end-to-end before Atlas credentials exist.
 *   That data disappears when the server stops and is never used in production.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI?.trim();
  mongoose.set('strictQuery', true);

  if (uri) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    return { mode: 'mongo_uri', name: mongoose.connection.name };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI is required in production. Set it to your MongoDB Atlas connection string.');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'campus_cart' } });
  await mongoose.connect(memoryServer.getUri('campus_cart'));
  console.warn(
    '[db] MONGO_URI not set — using a disposable in-memory MongoDB for development.\n' +
      '[db] Data is NOT persisted. Set MONGO_URI to MongoDB Atlas for durable storage.'
  );
  return { mode: 'memory', name: mongoose.connection.name };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export function dbHealth() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    connected: mongoose.connection.readyState === 1,
  };
}
