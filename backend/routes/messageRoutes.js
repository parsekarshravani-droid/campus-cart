import { Router } from 'express';
import {
  getConversation,
  getInbox,
  getSent,
  getUnreadCount,
  markMessageRead,
  sendMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { mongoIdRules, messageRules, userIdRules } from '../validators/rules.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.use(protect);
router.post('/', writeLimiter, messageRules, validate, sendMessage);
router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/unread-count', getUnreadCount);
router.get('/conversation/:userId', userIdRules, validate, getConversation);
router.patch('/:id/read', mongoIdRules, validate, markMessageRead);

export default router;
