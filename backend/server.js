import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, dbHealth, disconnectDB } from './config/db.js';
import { sanitizeRequest } from './middleware/sanitizeMiddleware.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { UPLOAD_DIR } from './services/storageService.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use('/api', apiLimiter);
if (!isProd) app.use(morgan('dev'));

// Locally stored uploads (development fallback when Cloudinary is not configured).
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: true }));

app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'CAMPUS CART API — Buy Smart. Sell Easy. Campus Connected.',
    data: { docs: '/api/health', version: '1.0.0' },
  })
);

app.get('/api/health', (_req, res) => {
  const db = dbHealth();
  res.status(db.connected ? 200 : 503).json({
    success: db.connected,
    message: db.connected ? 'API and database are healthy.' : 'API is running but the database is unavailable.',
    data: {
      status: db.connected ? 'ok' : 'degraded',
      database: db.state,
      uptimeSeconds: Math.round(process.uptime()),
      storage: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local-disk',
      emailVerification: Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT) || 5000;
  const boot = async () => {
    if (!process.env.JWT_SECRET && isProd) {
      throw new Error('JWT_SECRET is required in production.');
    }
    const { mode } = await connectDB();

    if (mode === 'memory' && process.env.SEED_DEMO_DATA !== 'false') {
      const { seedDemoData } = await import('./seed/seedData.js');
      await seedDemoData({ reset: false, silent: false });
    }

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`\n  CAMPUS CART API → http://localhost:${port}`);
      console.log(`  Health check    → http://localhost:${port}/api/health`);
      console.log(`  Database        → ${mode}`);
      console.log(`  Cloudinary      → ${process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'NOT configured (local uploads)'}\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} received — shutting down.`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  };

  boot().catch((error) => {
    console.error('[server] Failed to start:', error.message);
    process.exit(1);
  });
}

export default app;
