import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Vite server proxies /api and /uploads to the Express API,
// which keeps the auth cookie same-origin. In production the frontend calls
// VITE_API_URL directly (set it to your Render URL).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
});
