import { ApiError } from '../utils/ApiError.js';

/** Restrict a route to admin accounts. Must run after `protect`. */
export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required.'));
  }
  next();
}
