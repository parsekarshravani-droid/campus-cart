import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  startTestDB,
  stopTestDB,
  clearCollections,
  registerStudent,
  createProduct,
  agent,
} from './helpers/testEnv.js';

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(clearCollections);

describe('Wishlist', () => {
  it('adds a product, prevents duplicates and persists it across requests', async () => {
    const seller = await registerStudent({ email: 'seller@campus.edu' });
    const buyer = await registerStudent({ email: 'buyer@campus.edu' });
    const product = (await createProduct(seller.client)).body.data.product;

    const add = await buyer.client.post(`/api/wishlist/${product._id}`);
    expect(add.status).toBe(201);

    const duplicate = await buyer.client.post(`/api/wishlist/${product._id}`);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/already in your wishlist/i);

    const list = await buyer.client.get('/api/wishlist');
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0].product.title).toBe(product.title);
    expect(list.body.data.productIds).toContain(product._id);

    // Fresh request with the same cookie jar = session-level persistence.
    const refresh = await buyer.client.get('/api/wishlist');
    expect(refresh.body.data.total).toBe(1);
  });

  it('removes a saved product and reports missing entries', async () => {
    const seller = await registerStudent({ email: 'seller2@campus.edu' });
    const buyer = await registerStudent({ email: 'buyer2@campus.edu' });
    const product = (await createProduct(seller.client)).body.data.product;

    await buyer.client.post(`/api/wishlist/${product._id}`).expect(201);
    const removed = await buyer.client.delete(`/api/wishlist/${product._id}`);
    expect(removed.status).toBe(200);

    const list = await buyer.client.get('/api/wishlist');
    expect(list.body.data.items).toHaveLength(0);

    const removeAgain = await buyer.client.delete(`/api/wishlist/${product._id}`);
    expect(removeAgain.status).toBe(404);
  });

  it('keeps wishlists private per student', async () => {
    const seller = await registerStudent({ email: 'seller3@campus.edu' });
    const buyerA = await registerStudent({ email: 'buyerA@campus.edu' });
    const buyerB = await registerStudent({ email: 'buyerB@campus.edu' });
    const product = (await createProduct(seller.client)).body.data.product;

    await buyerA.client.post(`/api/wishlist/${product._id}`).expect(201);

    const listB = await buyerB.client.get('/api/wishlist');
    expect(listB.body.data.items).toHaveLength(0);
  });

  it('requires authentication and a real product', async () => {
    await agent().post('/api/wishlist/64b7f0f0f0f0f0f0f0f0f0f0').expect(401);

    const { client } = await registerStudent({ email: 'wishless@campus.edu' });
    const missing = await client.post('/api/wishlist/64b7f0f0f0f0f0f0f0f0f0f0');
    expect(missing.status).toBe(404);
  });
});
