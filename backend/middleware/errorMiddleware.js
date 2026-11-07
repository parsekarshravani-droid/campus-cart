import mongoose from 'mongoose';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  let details = error.details;

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    details = Object.values(error.errors).map((e) => e.message);
    message = details[0] || 'Validation failed';
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid identifier.';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || { field: 1 })[0];
    message =
      field === 'email'
        ? 'An account with this email already exists.'
        : field === 'user'
          ? 'This item is already in your wishlist.'
          : `Duplicate value for ${field}.`;
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
}
