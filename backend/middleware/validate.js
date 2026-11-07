import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { CATEGORIES, CONDITIONS, STATUSES } from '../models/Product.js';

/** Collect express-validator errors into the shared error shape. */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => e.msg);
  next(ApiError.badRequest(details[0] || 'Validation failed', details));
}

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const PRODUCT_CATEGORIES = CATEGORIES;
export const PRODUCT_CONDITIONS = CONDITIONS;
export const PRODUCT_STATUSES = STATUSES;
