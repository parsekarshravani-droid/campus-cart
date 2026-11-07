import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import {
  startTestDB,
  stopTestDB,
  clearCollections,
  registerStudent,
  createProduct,
  agent,
} from './helpers/testEnv.js';
import User from '../models/User.js';

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(clearCollections);

async function makeAdmin(email = 'admin@campus.edu') {
  const { client, user } = await registerStudent({ email, name: 'Moderator' });
  await User.updateOne({ _id: user._id }, { $set: { role: 'admin', isVerified: true } });
  return { client, user };
}

describe('Dashboard', () => {
  it('reports accurate counts scoped to the signed-in student', async () => {
    const me = await registerStudent({ email: 'me@campus.edu' });
    const other = await registerStudent({ email: 'other@campus.edu' });

    const first = (await createProduct(me.client, { title: 'My available book' })).body.data.product;
    const second = (await createProduct(me.client, { title: 'My sold chair', category: 'Furniture' })).body.data.product;
    await me.client.patch(`/api/products/${second._id}/status`).send({ status: 'sold' }).expect(200);
    await createProduct(other.client, { title: 'Someone else listing' });

    await me.client.post(`/api/wishlist/${first._id}`).expect(201);
    await other.client
      .post('/api/messages')
      .send({ receiver: me.user._id, product: first._id, message: 'Is this book still available?' })
      .expect(201);

    const dashboard = await me.client.get('/api/users/dashboard');
    expect(dashboard.status).toBe(200);
    const { stats } = dashboard.body.data;
    expect(stats.totalListings).toBe(2);
    expect(stats.activeListings).toBe(1);
    expect(stats.soldListings).toBe(1);
    expect(stats.wishlistCount).toBe(1);
    expect(stats.inquiriesReceived).toBe(1);
    expect(stats.unreadMessages).toBe(1);
    expect(dashboard.body.data.recentListings).toHaveLength(2);
    expect(dashboard.body.data.recentInquiries).toHaveLength(1);
    expect(dashboard.body.data.recentInquiries[0].other).toBeUndefined();
    expect(dashboard.body.data.user.email).toBe('me@campus.edu');
  });

  it('does not include another student listings in my-listings', async () => {
    const me = await registerStudent({ email: 'mine@campus.edu' });
    const other = await registerStudent({ email: 'theirs@campus.edu' });
    await createProduct(me.client, { title: 'Mine to keep' });
    await createProduct(other.client, { title: 'Not mine at all' });

    const res = await me.client.get('/api/products/my-listings');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].title).toBe('Mine to keep');
    expect(res.body.data.counts.available).toBe(1);
  });
});

describe('Admin moderation', () => {
  it('blocks non-admin students from every admin endpoint', async () => {
    const { client } = await registerStudent({ email: 'plain@campus.edu' });
    await client.get('/api/admin/stats').expect(403);
    await client.get('/api/admin/users').expect(403);
    await client.get('/api/admin/products').expect(403);
    await agent().get('/api/admin/stats').expect(401);
  });

  it('lets an admin see users, listings and marketplace statistics', async () => {
    const admin = await makeAdmin();
    const seller = await registerStudent({ email: 'seller@campus.edu' });
    await createProduct(seller.client);

    const stats = await admin.client.get('/api/admin/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.data.stats.totalUsers).toBeGreaterThanOrEqual(2);
    expect(stats.body.data.stats.totalProducts).toBe(1);
    expect(stats.body.data.stats.availableProducts).toBe(1);

    const users = await admin.client.get('/api/admin/users');
    expect(users.status).toBe(200);
    expect(users.body.data.users.every((u) => u.password === undefined)).toBe(true);

    const products = await admin.client.get('/api/admin/products');
    expect(products.body.data.products).toHaveLength(1);
    expect(products.body.data.products[0].seller.email).toBe('seller@campus.edu');
  });

  it('removes an inappropriate listing and suspends a user', async () => {
    const admin = await makeAdmin();
    const seller = await registerStudent({ email: 'suspended.seller@campus.edu' });
    const product = (await createProduct(seller.client)).body.data.product;

    const removed = await admin.client.delete(`/api/admin/products/${product._id}`);
    expect(removed.status).toBe(200);
    await agent().get(`/api/products/${product._id}`).expect(404);

    const suspended = await admin.client
      .patch(`/api/admin/users/${seller.user._id}/suspend`)
      .send({ suspended: true });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.user.isSuspended).toBe(true);

    // The suspended student can no longer use the API.
    await seller.client.get('/api/users/dashboard').expect(403);
  });

  it('prevents an admin from suspending their own account', async () => {
    const admin = await makeAdmin('self.admin@campus.edu');
    const res = await admin.client.patch(`/api/admin/users/${admin.user._id}/suspend`).send({ suspended: true });
    expect(res.status).toBe(400);
  });
});
