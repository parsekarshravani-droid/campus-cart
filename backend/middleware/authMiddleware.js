import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_COOKIE, verifyAuthToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Require a valid session. Attaches the fresh user document to req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please sign in to continue.');

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('+password');
  if (!user) throw ApiError.unauthorized('Account not found.');
  if (user.isSuspended) throw ApiError.forbidden('Your account is suspended. Contact your campus admin.');

  req.user = user;
  next();
});

/** Attach the user when a valid cookie exists, but never block the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me', {
      issuer: 'campus-cart',
    });
    const user = await User.findById(payload.sub);
    if (user && !user.isSuspended) req.user = user;
  } catch {
    /* ignore invalid token for public endpoints */
  }
  next();
});
