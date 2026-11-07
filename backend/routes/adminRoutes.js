import { Router } from 'express';
import {
  getStats,
  listProducts,
  listUsers,
  removeProduct,
  setProductStatus,
  setUserSuspension,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { validate } from '../middleware/validate.js';
import { mongoIdRules, statusRules } from '../validators/rules.js';

const router = Router();

router.use(protect, requireAdmin);
router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/suspend', mongoIdRules, validate, setUserSuspension);
router.get('/products', listProducts);
router.patch('/products/:id/status', mongoIdRules, statusRules, validate, setProductStatus);
router.delete('/products/:id', mongoIdRules, validate, removeProduct);

export default router;
