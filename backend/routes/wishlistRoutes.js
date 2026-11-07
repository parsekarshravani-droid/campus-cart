import { Router } from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { param } from 'express-validator';

const router = Router();

router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', [param('productId').isMongoId().withMessage('Invalid product id.')], validate, addToWishlist);
router.delete('/:productId', [param('productId').isMongoId().withMessage('Invalid product id.')], validate, removeFromWishlist);

export default router;
