import { Router } from 'express';
import { register, login, logout, me, verifyEmail, resendVerification } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginRules, registerRules, verifyEmailRules } from '../validators/rules.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/register', registerLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/verify-email', authLimiter, verifyEmailRules, validate, verifyEmail);
router.post('/resend-verification', authLimiter, protect, resendVerification);

export default router;
