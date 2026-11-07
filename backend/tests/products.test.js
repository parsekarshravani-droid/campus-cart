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

async function seedCatalog(sellerClient) {
  const items = [
    { title: 'Engineering Mathematics Textbook', category: 'Books & Study Materials', price: 250, condition: 'Good' },
    { title: 'Casio Scientific Calculator', category: 'Calculators', price: 650, condition: 'Like New' },
    { title: 'HP Laptop', category: 'Electronics', price: 18000, condition: 'Good' },
    { title: 'College Bicycle', category: 'Bicycles', price: 2500, condition: 'Fair' },
    { title: 'Hostel Study Table', category: 'Furniture', price: 900, condition: 'Fair' },
    { title: 'Headphones', category: 'Electronics', price: 750, condition: 'Brand New' },
  ];
  const created = [];
  for (const item of items) {
    const res = await createProduct(sellerClient, item);
    expect(res.status).toBe(201);
    created.push(res.body.data.product);
  }
  return created;
}

describe('Product listings', () => {
  it('creates a listing with an uploaded image and associates it with the seller', async () => {
    const { client, user } = await registerStudent({ college: 'Atharva College Of Engineering' });
    const res = await createProduct(client, { title: 'Casio FX-991EX Calculator' });

    expect(res.status).toBe(201);
    const product = res.body.data.product;
    expect(product.title).toBe('Casio FX-991EX Calculator');
    expect(product.seller._id).toBe(user._id);
    expect(product.college).toBe('Atharva College Of Engineering');
    expect(product.status).toBe('available');
    expect(product.images).toHaveLength(1);
    expect(product.images[0].url).toBeTruthy();
    expect(product.images[0].publicId).toBeTruthy();
  });

  it('rejects a listing without an image and validates required fields', async () => {
    const { client } = await registerStudent();

    const noImage = await client
      .post('/api/products')
      .field('title', 'No image listing')
      .field('description', 'This listing has no image attached to it.')
      .field('category', 'Others')
      .field('price', '100')
      .field('condition', 'Good')
      .field('location', 'Campus');
    expect(noImage.status).toBe(400);
    expect(noImage.body.message).toMatch(/at least one product photo/i);

    const badCategory = await createProduct(client, { category: 'Space Ships' });
    expect(badCategory.status).toBe(400);

    const badPrice = await createProduct(client, { price: -50 });
    expect(badPrice.status).toBe(400);

    const shortTitle = await createProduct(client, { title: 'ab' });
    expect(shortTitle.status).toBe(400);
  });

  it('serves search, category, price and condition filters from the database', async () => {
    const { client } = await registerStudent();
    await seedCatalog(client);

    const byTitle = await agent().get('/api/products?q=calculator');
    expect(byTitle.status).toBe(200);
    expect(byTitle.body.data.products).toHaveLength(1);
    expect(byTitle.body.data.products[0].title).toMatch(/Casio/);

    const byDescription = await agent().get('/api/products?q=first+year');
    expect(byDescription.body.data.products.length).toBeGreaterThan(0);

    const byCategory = await agent().get('/api/products?category=Electronics');
    expect(byCategory.body.data.products).toHaveLength(2);

    const priceRange = await agent().get('/api/products?minPrice=500&maxPrice=1000');
    expect(priceRange.body.data.products.map((p) => p.price).sort((a, b) => a - b)).toEqual([650, 750, 900]);

    const byCondition = await agent().get('/api/products?condition=Like+New');
    expect(byCondition.body.data.products).toHaveLength(1);

    const noResults = await agent().get('/api/products?q=quantum+teleporter');
    expect(noResults.body.data.products).toHaveLength(0);
    expect(noResults.body.data.total).toBe(0);
  });

  it('sorts by newest, oldest and price in both directions', async () => {
    const { client } = await registerStudent();
    await seedCatalog(client);

    const expensive = await agent().get('/api/products?sort=price-desc');
    expect(expensive.body.data.products[0].price).toBe(18000);

    const cheap = await agent().get('/api/products?sort=price-asc');
    expect(cheap.body.data.products[0].price).toBe(250);

    const newest = await agent().get('/api/products?sort=newest');
    expect(newest.body.data.products[0].title).toBe('Headphones');

    const oldest = await agent().get('/api/products?sort=oldest');
    expect(oldest.body.data.products[0].title).toBe('Engineering Mathematics Textbook');
  });

  it('paginates results with page/limit metadata', async () => {
    const { client } = await registerStudent();
    await seedCatalog(client);

    const page1 = await agent().get('/api/products?page=1&limit=2');
    expect(page1.body.data.products).toHaveLength(2);
    expect(page1.body.data.total).toBe(6);
    expect(page1.body.data.totalPages).toBe(3);
    expect(page1.body.data.hasMore).toBe(true);

    const page3 = await agent().get('/api/products?page=3&limit=2');
    expect(page3.body.data.products).toHaveLength(2);
    expect(page3.body.data.hasMore).toBe(false);
  });

  it('returns full details and related products from the same category', async () => {
    const { client } = await registerStudent();
    const [book] = await seedCatalog(client);
    await createProduct(client, { title: 'Data Structures Reference Book', category: 'Books & Study Materials' });

    const res = await agent().get(`/api/products/${book._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.description).toBeTruthy();
    expect(res.body.data.product.seller.email).toBeUndefined();
    expect(res.body.data.related.length).toBeGreaterThan(0);
    expect(res.body.data.related.every((p) => p.category === book.category)).toBe(true);

    await agent().get('/api/products/not-a-real-id').expect(400);
    await agent().get('/api/products/64b7f0f0f0f0f0f0f0f0f0f0').expect(404);
  });

  it('allows the owner to edit a listing and prevents other students from doing so', async () => {
    const owner = await registerStudent({ email: 'owner@campus.edu' });
    const intruder = await registerStudent({ email: 'intruder@campus.edu' });
    const created = await createProduct(owner.client);
    const id = created.body.data.product._id;

    const update = await owner.client
      .put(`/api/products/${id}`)
      .field('title', 'Updated Mathematics Textbook')
      .field('description', 'Updated description that is long enough to pass validation.')
      .field('category', 'Books & Study Materials')
      .field('price', '199')
      .field('condition', 'Fair')
      .field('location', 'Library Gate');
    expect(update.status).toBe(200);
    expect(update.body.data.product.price).toBe(199);
    expect(update.body.data.product.title).toBe('Updated Mathematics Textbook');
    expect(update.body.data.product.images).toHaveLength(1); // existing image kept

    const forbidden = await intruder.client
      .put(`/api/products/${id}`)
      .field('title', 'Hijacked listing')
      .field('description', 'Trying to edit someone else their listing here.')
      .field('category', 'Others')
      .field('price', '1')
      .field('condition', 'Fair')
      .field('location', 'Nowhere');
    expect(forbidden.status).toBe(403);

    const forbiddenDelete = await intruder.client.delete(`/api/products/${id}`);
    expect(forbiddenDelete.status).toBe(403);

    const forbiddenStatus = await intruder.client.patch(`/api/products/${id}/status`).send({ status: 'sold' });
    expect(forbiddenStatus.status).toBe(403);
  });

  it('marks a listing as sold, hides it from the marketplace and shows it in my listings', async () => {
    const { client } = await registerStudent();
    const created = await createProduct(client);
    const id = created.body.data.product._id;

    const sold = await client.patch(`/api/products/${id}/status`).send({ status: 'sold' });
    expect(sold.status).toBe(200);
    expect(sold.body.data.product.status).toBe('sold');

    const publicList = await agent().get('/api/products');
    expect(publicList.body.data.products.find((p) => p._id === id)).toBeUndefined();

    const mine = await client.get('/api/products/my-listings');
    expect(mine.status).toBe(200);
    expect(mine.body.data.counts.sold).toBe(1);

    const invalidStatus = await client.patch(`/api/products/${id}/status`).send({ status: 'exploded' });
    expect(invalidStatus.status).toBe(400);
  });

  it('deletes a listing and removes it from the marketplace', async () => {
    const { client } = await registerStudent();
    const created = await createProduct(client);
    const id = created.body.data.product._id;

    const deleted = await client.delete(`/api/products/${id}`);
    expect(deleted.status).toBe(200);

    await agent().get(`/api/products/${id}`).expect(404);
    const list = await agent().get('/api/products');
    expect(list.body.data.total).toBe(0);

    const again = await client.delete(`/api/products/${id}`);
    expect(again.status).toBe(404);
  });

  it('exposes filter metadata for the browse page', async () => {
    const { client } = await registerStudent();
    await seedCatalog(client);

    const res = await agent().get('/api/products/meta');
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(9);
    expect(res.body.data.conditions).toContain('Brand New');
    expect(res.body.data.colleges.length).toBeGreaterThan(0);
    expect(res.body.data.priceRange.max).toBe(18000);
  });
});
