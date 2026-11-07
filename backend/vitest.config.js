import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 180000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'campus-cart-test-secret',
      DISABLE_RATE_LIMIT: 'true',
      SEED_DEMO_DATA: 'false',
      FRONTEND_URL: 'http://localhost:5173',
    },
  },
});
