import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getMyListings,
  getProductById,
  getProductMeta,
  getProducts,
  updateProduct,
  updateProductStatus,
} from '../controllers/productController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadProductImages } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  productIdRules,
  productQueryRules,
  productRules,
  statusRules,
} from '../validators/rules.js';
import { writeLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/meta', getProductMeta);
router.get('/my-listings', protect, getMyListings);
router.get('/', productQueryRules, validate, getProducts);
router.get('/:id', optionalAuth, productIdRules, validate, getProductById);

router.post('/', protect, writeLimiter, uploadProductImages, productRules, validate, createProduct);
router.put('/:id', protect, writeLimiter, uploadProductImages, productIdRules, productRules, validate, updateProduct);
router.delete('/:id', protect, productIdRules, validate, deleteProduct);
router.patch('/:id/status', protect, productIdRules, statusRules, validate, updateProductStatus);

export default router;
