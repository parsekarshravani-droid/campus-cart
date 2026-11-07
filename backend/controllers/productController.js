import mongoose from 'mongoose';
import Product, { CATEGORIES, CONDITIONS, STATUSES } from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { uploadImages, deleteImages } from '../services/storageService.js';
import { escapeRegex } from '../middleware/validate.js';

const SELLER_FIELDS = 'name college department year profileImage isVerified role createdAt';
const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { views: -1, createdAt: -1 },
};

function buildFilter(query) {
  const filter = {};

  if (query.status) filter.status = query.status;
  else filter.status = 'available';

  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { category: rx }, { location: rx }];
  }

  if (query.college) filter.college = new RegExp(`^${escapeRegex(query.college.trim())}$`, 'i');

  if (query.minPrice != null || query.maxPrice != null) {
    filter.price = {};
    if (query.minPrice != null) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice != null) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.seller && mongoose.isValidObjectId(query.seller)) filter.seller = query.seller;

  return filter;
}

function parseRemovedImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

/** Public marketplace listing with search, filters, sorting and pagination. */
export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const filter = buildFilter(req.query);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', SELLER_FIELDS)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return ok(res, 200, 'Products fetched.', {
    products,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasMore: page * limit < total,
  });
});

/** Filter metadata for the browse UI (categories, conditions, colleges, price range). */
export const getProductMeta = asyncHandler(async (_req, res) => {
  const [colleges, priceRange, counts] = await Promise.all([
    Product.distinct('college', { status: 'available' }),
    Product.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
    Product.aggregate([{ $match: { status: 'available' } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  return ok(res, 200, 'Filter metadata fetched.', {
    categories: CATEGORIES.map((name) => ({
      name,
      count: counts.find((c) => c._id === name)?.count || 0,
    })),
    conditions: CONDITIONS,
    statuses: STATUSES,
    colleges: colleges.sort(),
    priceRange: { min: priceRange[0]?.min ?? 0, max: priceRange[0]?.max ?? 0 },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('seller', SELLER_FIELDS);

  if (!product) throw ApiError.notFound('Listing not found.');

  const [wishlisted, related] = await Promise.all([
    req.user ? Wishlist.exists({ user: req.user._id, product: product._id }) : null,
    Product.find({
      _id: { $ne: product._id },
      status: 'available',
      category: product.category,
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('seller', SELLER_FIELDS)
      .lean(),
  ]);

  return ok(res, 200, 'Listing fetched.', {
    product: product.toObject(),
    isWishlisted: Boolean(wishlisted),
    related,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('Add at least one product photo.');

  // Product data is validated before any image is uploaded.
  const images = await uploadImages(files);

  try {
    const product = await Product.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      originalPrice: req.body.originalPrice ?? null,
      condition: req.body.condition,
      location: req.body.location,
      college: req.body.college || req.user.college,
      status: req.body.status === 'sold' ? 'sold' : 'available',
      images,
      seller: req.user._id,
    });

    const populated = await product.populate('seller', SELLER_FIELDS);
    return ok(res, 201, 'Listing published successfully.', { product: populated });
  } catch (error) {
    await deleteImages(images); // never leave orphaned uploads behind
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Listing not found.');

  const isOwner = String(product.seller) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only edit your own listings.');
  }

  const removedIds = parseRemovedImages(req.body.removedImages);
  const isRemoved = (image) =>
    (image.publicId && removedIds.includes(image.publicId)) || removedIds.includes(image.url);
  const removed = product.images.filter(isRemoved);
  const kept = product.images.filter((image) => !isRemoved(image));

  const newImages = req.files?.length ? await uploadImages(req.files) : [];
  if (kept.length + newImages.length > 5) {
    await deleteImages(newImages);
    throw ApiError.badRequest('A listing can have a maximum of 5 images.');
  }
  if (kept.length + newImages.length === 0) {
    await deleteImages(newImages);
    throw ApiError.badRequest('Keep at least one product photo.');
  }

  const fields = ['title', 'description', 'category', 'price', 'condition', 'location', 'college'];
  for (const field of fields) {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  }
  if (req.body.originalPrice !== undefined) {
    product.originalPrice = req.body.originalPrice === '' ? null : Number(req.body.originalPrice);
  }
  if (req.body.status && ['available', 'sold'].includes(req.body.status)) product.status = req.body.status;

  product.images = [...kept, ...newImages];
  await product.save();
  await deleteImages(removed);

  const populated = await product.populate('seller', SELLER_FIELDS);
  return ok(res, 200, 'Listing updated successfully.', { product: populated });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Listing not found.');

  const isOwner = String(product.seller) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own listings.');
  }

  await Promise.all([
    Wishlist.deleteMany({ product: product._id }),
    Message.deleteMany({ product: product._id }),
    deleteImages(product.images),
    product.deleteOne(),
  ]);

  return ok(res, 200, 'Listing deleted successfully.', { id: req.params.id });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Listing not found.');
  if (String(product.seller) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only update your own listings.');
  }

  product.status = req.body.status;
  await product.save();

  return ok(res, 200, `Listing marked as ${req.body.status}.`, { product });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const filter = { seller: req.user._id };
  if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return ok(res, 200, 'Your listings fetched.', {
    products,
    counts: {
      total: products.length,
      available: products.filter((p) => p.status === 'available').length,
      sold: products.filter((p) => p.status === 'sold').length,
      removed: products.filter((p) => p.status === 'removed').length,
    },
  });
});
