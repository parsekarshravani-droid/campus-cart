import User from '../models/User.js';
import Product from '../models/Product.js';
import Message from '../models/Message.js';
import Wishlist from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { deleteImages } from '../services/storageService.js';
import { escapeRegex } from '../middleware/validate.js';
import { sendSuspensionEmail } from '../services/mailService.js';

export const getStats = asyncHandler(async (_req, res) => {
  const [totalUsers, suspendedUsers, totalProducts, availableProducts, soldProducts, totalMessages, totalWishlist] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSuspended: true }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'available' }),
      Product.countDocuments({ status: 'sold' }),
      Message.countDocuments(),
      Wishlist.countDocuments(),
    ]);

  return ok(res, 200, 'Marketplace statistics fetched.', {
    stats: {
      totalUsers,
      suspendedUsers,
      totalProducts,
      availableProducts,
      soldProducts,
      totalMessages,
      totalWishlist,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { college: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return ok(res, 200, 'Users fetched.', { users, page, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: rx }, { category: rx }, { college: rx }];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', 'name email college')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return ok(res, 200, 'Products fetched.', { products, page, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

export const setProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Listing not found.');
  product.status = req.body.status;
  await product.save();
  return ok(res, 200, `Listing marked as ${req.body.status}.`, { product });
});

export const removeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Listing not found.');
  await Promise.all([
    Wishlist.deleteMany({ product: product._id }),
    Message.deleteMany({ product: product._id }),
    deleteImages(product.images),
    product.deleteOne(),
  ]);
  return ok(res, 200, 'Listing removed by admin.', { id: req.params.id });
});

export const setUserSuspension = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Student not found.');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot suspend your own account.');

  user.isSuspended = Boolean(req.body.suspended);
  if (user.isSuspended) {
    // Suspended sellers disappear from the public marketplace.
    await Product.updateMany({ seller: user._id, status: 'available' }, { $set: { status: 'removed' } });
  }
  await user.save({ validateBeforeSave: false });

  try {
    await sendSuspensionEmail(user, user.isSuspended);
  } catch (error) {
    console.warn(`[admin] Suspension email failed: ${error.message}`);
  }

  return ok(res, 200, user.isSuspended ? 'Account suspended.' : 'Account reinstated.', { user: user.toJSON() });
});
