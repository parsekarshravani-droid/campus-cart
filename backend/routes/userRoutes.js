import { Router } from 'express';
import { getDashboard, getProfile, getUserById, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { mongoIdRules, profileRules } from '../validators/rules.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', profileRules, validate, updateProfile);
router.get('/dashboard', getDashboard);
router.get('/:id', mongoIdRules, validate, getUserById);

export default router;
