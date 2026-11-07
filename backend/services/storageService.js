import { getCloudinary, CLOUDINARY_FOLDER, isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function uploadToCloudinary(buffer) {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' });
      }
    );
    stream.end(buffer);
  });
}

async function uploadToLocalDisk(buffer, mimetype) {
  const ext = EXT_BY_MIME[mimetype] || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  // Relative URLs work through the Vite dev proxy and with VITE_API_URL in production.
  const base = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
  return { url: `${base}/uploads/${filename}`, publicId: filename, provider: 'local' };
}

/**
 * Upload a single in-memory image.
 * Cloudinary is used whenever credentials are configured; otherwise the file
 * is written to the local uploads directory (development fallback only).
 */
export async function uploadImage(file) {
  try {
    if (isCloudinaryConfigured()) return await uploadToCloudinary(file.buffer);
    return await uploadToLocalDisk(file.buffer, file.mimetype);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, `Image upload failed: ${error.message}`);
  }
}

export async function uploadImages(files = []) {
  const results = [];
  for (const file of files) {
    results.push(await uploadImage(file));
  }
  return results;
}

/** Best-effort removal so a storage hiccup can never block listing deletion. */
export async function deleteImage(image) {
  if (!image) return;
  try {
    if (image.provider === 'cloudinary' && image.publicId && isCloudinaryConfigured()) {
      await getCloudinary().uploader.destroy(image.publicId);
      return;
    }
    if (image.provider === 'local' && image.publicId) {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(image.publicId)));
    }
  } catch (error) {
    console.warn(`[storage] Could not delete image ${image.publicId || image.url}: ${error.message}`);
  }
}

export async function deleteImages(images = []) {
  await Promise.all(images.map((image) => deleteImage(image)));
}
