import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { startTestDB, stopTestDB, clearCollections, agent, student, registerStudent } from './helpers/testEnv.js';

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(clearCollections);

describe('Authentication', () => {
  it('registers a new student, hashes the password and sets an httpOnly cookie', async () => {
    const res = await agent().post('/api/auth/register').send(student({ email: 'new.student@campus.edu' }));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new.student@campus.edu');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.isVerified).toBe(false);

    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toContain('cc_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie.toLowerCase()).toContain('samesite=lax');
  });

  it('rejects a duplicate email address', async () => {
    const payload = student({ email: 'duplicate@campus.edu' });
    await agent().post('/api/auth/register').send(payload).expect(201);
    const res = await agent().post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('validates registration input (bad email, short password, mismatched confirmation, missing fields)', async () => {
    const badEmail = await agent()
      .post('/api/auth/register')
      .send(student({ email: 'not-an-email', password: 'Password1', confirmPassword: 'Password1' }));
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.message).toMatch(/valid email/i);

    const shortPassword = await agent()
      .post('/api/auth/register')
      .send(student({ password: 'abc', confirmPassword: 'abc' }));
    expect(shortPassword.status).toBe(400);

    const mismatch = await agent()
      .post('/api/auth/register')
      .send(student({ confirmPassword: 'Different1' }));
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.message).toMatch(/do not match/i);

    const missing = await agent().post('/api/auth/register').send({ email: 'x@campus.edu' });
    expect(missing.status).toBe(400);
  });

  it('logs in with valid credentials, rejects wrong ones, restores session and logs out', async () => {
    const client = agent();
    await client.post('/api/auth/register').send(student({ email: 'login@campus.edu' })).expect(201);

    const valid = await client.post('/api/auth/login').send({ email: 'login@campus.edu', password: 'Student@123' });
    expect(valid.status).toBe(200);
    expect(valid.body.data.user.email).toBe('login@campus.edu');

    const invalid = await agent()
      .post('/api/auth/login')
      .send({ email: 'login@campus.edu', password: 'WrongPassword1' });
    expect(invalid.status).toBe(401);

    const unknown = await agent()
      .post('/api/auth/login')
      .send({ email: 'ghost@campus.edu', password: 'Student@123' });
    expect(unknown.status).toBe(401);

    const me = await client.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('login@campus.edu');

    const logout = await client.post('/api/auth/logout');
    expect(logout.status).toBe(200);

    const afterLogout = await client.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  it('blocks protected endpoints without a session', async () => {
    await agent().get('/api/auth/me').expect(401);
    await agent().get('/api/users/dashboard').expect(401);
    await agent().get('/api/wishlist').expect(401);
    await agent().get('/api/messages/inbox').expect(401);
    await agent().post('/api/products').field('title', 'No auth').expect(401);
  });

  it('refuses invalid verification tokens', async () => {
    const res = await agent().post('/api/auth/verify-email').send({ token: 'a'.repeat(40) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it('lets the owner update their profile and never returns private fields to other students', async () => {
    const { client, user } = await registerStudent({ name: 'Profile Owner', email: 'profile@campus.edu' });
    const update = await client
      .put('/api/users/profile')
      .send({ name: 'Updated Name', department: 'Electronics', year: '3rd Year', phone: '9998887776' });
    expect(update.status).toBe(200);
    expect(update.body.data.user.name).toBe('Updated Name');
    expect(update.body.data.user.phone).toBe('9998887776');

    const { client: otherClient } = await registerStudent({ email: 'viewer@campus.edu' });
    const profile = await otherClient.get(`/api/users/${user._id}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.email).toBeUndefined();
    expect(profile.body.data.user.phone).toBeUndefined();
  });
});
