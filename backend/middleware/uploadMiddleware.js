import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const mimeOk = ALLOWED_MIME.includes(file.mimetype);
  const extOk = ALLOWED_EXT.test(file.originalname || '');
  if (!mimeOk || !extOk) {
    return cb(ApiError.badRequest('Only JPG, JPEG, PNG or WebP images are allowed.'));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES },
});

/** Accept up to 5 product images from the `images` field. */
export const uploadProductImages = (req, res, next) => {
  upload.array('images', MAX_IMAGES)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('Each image must be 5 MB or smaller.'));
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(ApiError.badRequest(`You can upload a maximum of ${MAX_IMAGES} images.`));
      }
      return next(ApiError.badRequest(error.message));
    }
    return next(error);
  });
};
