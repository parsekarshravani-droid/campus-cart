import rateLimit from 'express-rate-limit';

const message = {
  success: false,
  message: 'Too many requests. Please wait a moment and try again.',
};

// The automated test suite disables limits so many auth flows can run from one IP.
const skip = () => process.env.DISABLE_RATE_LIMIT === 'true';
const base = { standardHeaders: true, legacyHeaders: false, message, skip };

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 20 });
export const registerLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 10 });
export const writeLimiter = rateLimit({ ...base, windowMs: 10 * 60 * 1000, limit: 120 });
export const apiLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 });
