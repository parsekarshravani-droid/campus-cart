import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export const AUTH_COOKIE = 'cc_token';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }
  return 'dev-only-insecure-jwt-secret-change-me';
}

export function signAuthToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role || 'student' }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'campus-cart',
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getSecret(), { issuer: 'campus-cart' });
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, cookieOptions());
}

export function clearAuthCookie(res) {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(AUTH_COOKIE, rest);
}

/** Random, URL-safe verification token. Only its hash is stored in MongoDB. */
export function createVerificationToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  return {
    raw,
    hash: crypto.createHash('sha256').update(raw).digest('hex'),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
