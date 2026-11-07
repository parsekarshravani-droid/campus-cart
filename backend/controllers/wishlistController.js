import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';

const SELLER_FIELDS = 'name college profileImage isVerified';

export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw ApiError.notFound('Listing not found.');
  if (product.status === 'removed') throw ApiError.badRequest('This listing is no longer available.');

  const existing = await Wishlist.findOne({ user: req.user._id, product: product._id });
  if (existing) throw ApiError.conflict('This item is already in your wishlist.');

  const entry = await Wishlist.create({ user: req.user._id, product: product._id });
  return ok(res, 201, 'Saved to your wishlist.', { wishlistId: entry._id, productId: product._id });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const deleted = await Wishlist.findOneAndDelete({
    user: req.user._id,
    product: req.params.productId,
  });
  if (!deleted) throw ApiError.notFound('This item is not in your wishlist.');

  return ok(res, 200, 'Removed from your wishlist.', { productId: req.params.productId });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const entries = await Wishlist.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'product', populate: { path: 'seller', select: SELLER_FIELDS } })
    .lean();

  const items = entries.filter((entry) => entry.product);
  return ok(res, 200, 'Wishlist fetched.', {
    items,
    productIds: items.map((item) => String(item.product._id)),
    total: items.length,
  });
});
