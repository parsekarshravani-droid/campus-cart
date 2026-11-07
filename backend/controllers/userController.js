import User from '../models/User.js';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) =>
  ok(res, 200, 'Profile fetched.', { user: req.user.toJSON() })
);

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'college', 'department', 'year', 'phone', 'profileImage'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  await req.user.save({ validateBeforeSave: false });
  return ok(res, 200, 'Profile updated successfully.', { user: req.user.toJSON() });
});

/** Public seller profile — never exposes email or phone. */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name college department year profileImage isVerified role createdAt'
  );
  if (!user) throw ApiError.notFound('Student not found.');

  const [listingCount, soldCount, availableListings] = await Promise.all([
    Product.countDocuments({ seller: user._id, status: { $ne: 'removed' } }),
    Product.countDocuments({ seller: user._id, status: 'sold' }),
    Product.find({ seller: user._id, status: 'available' }).sort({ createdAt: -1 }).limit(12).lean(),
  ]);

  return ok(res, 200, 'Student profile fetched.', {
    user,
    stats: { listingCount, soldCount },
    listings: availableListings,
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalListings,
    activeListings,
    soldListings,
    wishlistCount,
    inquiriesReceived,
    unreadMessages,
    recentListings,
    recentInquiries,
    viewsAgg,
  ] = await Promise.all([
    Product.countDocuments({ seller: userId, status: { $ne: 'removed' } }),
    Product.countDocuments({ seller: userId, status: 'available' }),
    Product.countDocuments({ seller: userId, status: 'sold' }),
    Wishlist.countDocuments({ user: userId }),
    Message.countDocuments({ receiver: userId }),
    Message.countDocuments({ receiver: userId, read: false }),
    Product.find({ seller: userId }).sort({ createdAt: -1 }).limit(4).lean(),
    Message.find({ receiver: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'name college profileImage')
      .populate('product', 'title images price status')
      .lean(),
    Product.aggregate([{ $match: { seller: userId } }, { $group: { _id: null, views: { $sum: '$views' } } }]),
  ]);

  return ok(res, 200, 'Dashboard fetched.', {
    stats: {
      totalListings,
      activeListings,
      soldListings,
      wishlistCount,
      inquiriesReceived,
      unreadMessages,
      totalViews: viewsAgg[0]?.views || 0,
    },
    recentListings,
    recentInquiries,
    user: req.user.toJSON(),
  });
});
