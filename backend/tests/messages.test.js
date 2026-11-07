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

async function setupConversation() {
  const seller = await registerStudent({ name: 'Seller Student', email: 'seller@campus.edu' });
  const buyer = await registerStudent({ name: 'Buyer Student', email: 'buyer@campus.edu' });
  const outsider = await registerStudent({ name: 'Outsider Student', email: 'outsider@campus.edu' });
  const product = (await createProduct(seller.client)).body.data.product;
  return { seller, buyer, outsider, product };
}

describe('Messaging', () => {
  it('sends an inquiry from buyer to seller and shows it in both inbox and sent', async () => {
    const { seller, buyer, product } = await setupConversation();

    const sent = await buyer.client
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: 'Is this still available?' });
    expect(sent.status).toBe(201);
    expect(sent.body.data.message.message).toBe('Is this still available?');

    const inbox = await seller.client.get('/api/messages/inbox');
    expect(inbox.status).toBe(200);
    expect(inbox.body.data.threads).toHaveLength(1);
    expect(inbox.body.data.threads[0].other.email).toBeUndefined();
    expect(inbox.body.data.threads[0].other.name).toBe('Buyer Student');
    expect(inbox.body.data.threads[0].unread).toBe(1);
    expect(inbox.body.data.unread).toBe(1);

    const outbox = await buyer.client.get('/api/messages/sent');
    expect(outbox.body.data.threads).toHaveLength(1);
    expect(outbox.body.data.threads[0].other.name).toBe('Seller Student');
  });

  it('returns the conversation to both participants and marks messages read', async () => {
    const { seller, buyer, product } = await setupConversation();

    await buyer.client
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: 'Can we meet at the library?' })
      .expect(201);
    await seller.client
      .post('/api/messages')
      .send({ receiver: buyer.user._id, product: product._id, message: 'Sure, 4 PM works for me.' })
      .expect(201);

    const thread = await seller.client.get(`/api/messages/conversation/${buyer.user._id}?product=${product._id}`);
    expect(thread.status).toBe(200);
    expect(thread.body.data.messages).toHaveLength(2);
    expect(thread.body.data.other.name).toBe('Buyer Student');
    expect(thread.body.data.product.title).toBe(product.title);

    const unread = await seller.client.get('/api/messages/unread-count');
    expect(unread.body.data.unread).toBe(0);
  });

  it('never leaks a conversation to an unrelated student', async () => {
    const { seller, buyer, outsider, product } = await setupConversation();

    await buyer.client
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: 'Private buyer seller message.' })
      .expect(201);

    const outsiderThread = await outsider.client.get(`/api/messages/conversation/${buyer.user._id}`);
    expect(outsiderThread.status).toBe(200);
    expect(outsiderThread.body.data.messages).toHaveLength(0);

    const outsiderInbox = await outsider.client.get('/api/messages/inbox');
    expect(outsiderInbox.body.data.threads).toHaveLength(0);
  });

  it('validates messages: empty text, self messaging, unknown receiver', async () => {
    const { seller, buyer, product } = await setupConversation();

    const empty = await buyer.client
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: '   ' });
    expect(empty.status).toBe(400);

    const self = await buyer.client
      .post('/api/messages')
      .send({ receiver: buyer.user._id, product: product._id, message: 'Talking to myself' });
    expect(self.status).toBe(400);

    const unknown = await buyer.client
      .post('/api/messages')
      .send({ receiver: '64b7f0f0f0f0f0f0f0f0f0f0', product: product._id, message: 'Hello there' });
    expect(unknown.status).toBe(404);

    const unauth = await agent()
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: 'No session' });
    expect(unauth.status).toBe(401);
  });

  it('only the receiver can mark a message as read', async () => {
    const { seller, buyer, product } = await setupConversation();

    const sent = await buyer.client
      .post('/api/messages')
      .send({ receiver: seller.user._id, product: product._id, message: 'Please mark me as read.' });
    const messageId = sent.body.data.message._id;

    const senderAttempt = await buyer.client.patch(`/api/messages/${messageId}/read`);
    expect(senderAttempt.status).toBe(403);

    const receiverAttempt = await seller.client.patch(`/api/messages/${messageId}/read`);
    expect(receiverAttempt.status).toBe(200);
    expect(receiverAttempt.body.data.message.read).toBe(true);
  });
});
