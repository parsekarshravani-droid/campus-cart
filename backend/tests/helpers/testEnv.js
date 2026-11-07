import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import app from '../../server.js';
import { UPLOAD_DIR } from '../../services/storageService.js';

let mongod;

export async function startTestDB() {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'campus_cart_test' } });
  await mongoose.connect(mongod.getUri('campus_cart_test'));
}

export async function stopTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  // Remove images written to local disk during product upload tests.
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    await Promise.all(files.map((file) => fs.unlink(path.join(UPLOAD_DIR, file))));
  } catch {
    /* uploads directory may not exist */
  }
}

export async function clearCollections() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export const agent = () => request.agent(app);
export { app, request };

/** A valid 1x1 PNG used as an uploaded product image. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const student = (overrides = {}) => ({
  name: 'Test Student',
  email: `student${Date.now()}${Math.floor(Math.random() * 1e5)}@campus.edu`,
  password: 'Student@123',
  confirmPassword: 'Student@123',
  college: 'Atharva College Of Engineering',
  department: 'Computer Science',
  year: '2nd Year',
  phone: '9876543210',
  ...overrides,
});

export async function registerStudent(overrides = {}) {
  const client = agent();
  const payload = student(overrides);
  const res = await client.post('/api/auth/register').send(payload);
  if (res.status !== 201) throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { client, user: res.body.data.user, payload, token: res.headers['set-cookie'] };
}

export function productPayload(overrides = {}) {
  return {
    title: 'Engineering Mathematics Textbook',
    description: 'Well maintained textbook with all pages intact, perfect for first year students.',
    category: 'Books & Study Materials',
    price: 250,
    originalPrice: 795,
    condition: 'Good',
    location: 'Central Library',
    ...overrides,
  };
}

export async function createProduct(client, overrides = {}) {
  const payload = productPayload(overrides);
  let req = client.post('/api/products');
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) req = req.field(key, String(value));
  }
  const res = await req.attach('images', TINY_PNG, { filename: 'book.png', contentType: 'image/png' });
  return res;
}
