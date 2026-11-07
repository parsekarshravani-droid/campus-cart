/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, statusCode, message, data) =>
  res.status(statusCode).json({ success: true, message, data });
