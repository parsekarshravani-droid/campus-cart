import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || '').trim() || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // JWT travels in an httpOnly cookie
  timeout: 30000,
});

/** Turn relative upload paths into a URL the browser can load. */
export function assetUrl(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Human-readable message from an API/network error. */
export function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the CAMPUS CART API. Please check your connection.';
  return error?.message || 'Something went wrong. Please try again.';
}

export default api;
