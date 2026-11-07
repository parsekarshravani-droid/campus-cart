import { ApiError } from '../utils/ApiError.js';

const FORBIDDEN_KEY = /^\$|\./;

/** Recursively remove Mongo operator keys ($gt, $where) and dotted paths. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const output = {};
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(key)) continue;
      output[key] = clean(nested);
    }
    return output;
  }
  return value;
}

/** NoSQL-injection guard for body, query and route params. */
export function sanitizeRequest(req, _res, next) {
  try {
    if (req.body && typeof req.body === 'object') req.body = clean(req.body);
    if (req.params && typeof req.params === 'object') req.params = clean(req.params);
    if (req.query && typeof req.query === 'object') {
      // Express 5 exposes a getter; Express 4 allows assignment.
      try {
        req.query = clean(req.query);
      } catch {
        for (const key of Object.keys(req.query)) {
          if (FORBIDDEN_KEY.test(key)) delete req.query[key];
        }
      }
    }
    next();
  } catch (error) {
    next(ApiError.badRequest('Malformed request payload.'));
  }
}
