import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';

const USER_FIELDS = 'name college department year profileImage isVerified';
const PRODUCT_FIELDS = 'title price images status category';

/** Group recent messages into one row per (counterpart + product). */
async function buildThreads(matchField, user, otherField) {
  const rows = await Message.aggregate([
    { $match: { [matchField]: user._id } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { other: `$${otherField}`, product: '$product' },
        lastMessage: { $first: '$message' },
        lastAt: { $first: '$createdAt' },
        lastSender: { $first: '$sender' },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiver', user._id] }, { $eq: ['$read', false] }] }, 1, 0],
          },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { lastAt: -1 } },
    { $limit: 100 },
  ]);

  const otherIds = [...new Set(rows.map((row) => String(row._id.other)))];
  const productIds = [...new Set(rows.map((row) => String(row._id.product)))];

  const [users, products] = await Promise.all([
    User.find({ _id: { $in: otherIds } }).select(USER_FIELDS).lean(),
    Product.find({ _id: { $in: productIds } }).select(PRODUCT_FIELDS).lean(),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return rows
    .map((row) => ({
      id: `${row._id.other}-${row._id.product}`,
      other: userMap.get(String(row._id.other)) || null,
      product: productMap.get(String(row._id.product)) || null,
      lastMessage: row.lastMessage,
      lastSender: row.lastSender,
      lastAt: row.lastAt,
      unread: row.unread,
      total: row.total,
      direction: matchField === 'receiver' ? 'incoming' : 'outgoing',
    }))
    .filter((thread) => thread.other && thread.product);
}

export const sendMessage = asyncHandler(async (req, res) => {
  const { receiver, product, message } = req.body;

  if (String(receiver) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot send a message to yourself.');
  }

  const [recipient, listing] = await Promise.all([User.findById(receiver), Product.findById(product)]);
  if (!recipient) throw ApiError.notFound('Seller not found.');
  if (!listing) throw ApiError.notFound('Listing not found.');

  const created = await Message.create({
    sender: req.user._id,
    receiver: recipient._id,
    product: listing._id,
    message,
  });

  const populated = await created.populate([
    { path: 'sender', select: USER_FIELDS },
    { path: 'receiver', select: USER_FIELDS },
    { path: 'product', select: PRODUCT_FIELDS },
  ]);

  return ok(res, 201, 'Message sent to the seller.', { message: populated });
});

export const getInbox = asyncHandler(async (req, res) => {
  const threads = await buildThreads('receiver', req.user, 'sender');
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);
  return ok(res, 200, 'Inbox fetched.', { threads, unread });
});

export const getSent = asyncHandler(async (req, res) => {
  const threads = await buildThreads('sender', req.user, 'receiver');
  return ok(res, 200, 'Sent messages fetched.', { threads });
});

/**
 * Full thread between the signed-in student and one other student,
 * optionally scoped to a product. No third student can ever read it,
 * because the query is always constrained to these two participants.
 */
export const getConversation = asyncHandler(async (req, res) => {
  const otherId = req.params.userId;
  if (String(otherId) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot open a conversation with yourself.');
  }

  const other = await User.findById(otherId).select(USER_FIELDS);
  if (!other) throw ApiError.notFound('Student not found.');

  const filter = {
    $or: [
      { sender: req.user._id, receiver: otherId },
      { sender: otherId, receiver: req.user._id },
    ],
  };
  if (req.query.product && /^[a-f0-9]{24}$/i.test(req.query.product)) {
    filter.product = req.query.product;
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: 1 })
    .populate('sender', USER_FIELDS)
    .populate('product', PRODUCT_FIELDS)
    .lean();

  // Opening the thread marks the other student's messages as read.
  await Message.updateMany({ sender: otherId, receiver: req.user._id, read: false }, { $set: { read: true } });

  const product = messages.find((m) => m.product)?.product || null;
  return ok(res, 200, 'Conversation fetched.', { messages, other, product });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found.');
  if (String(message.receiver) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only mark messages sent to you as read.');
  }
  if (!message.read) {
    message.read = true;
    await message.save();
  }
  return ok(res, 200, 'Message marked as read.', { message });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unread = await Message.countDocuments({ receiver: req.user._id, read: false });
  return ok(res, 200, 'Unread count fetched.', { unread });
});
