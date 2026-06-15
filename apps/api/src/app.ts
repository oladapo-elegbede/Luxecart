import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/database';
import { apiLimiter } from './middleware/rate-limiter';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import addressRoutes from './modules/addresses/addresses.routes';
import categoryRoutes from './modules/categories/categories.routes';
import productRoutes from './modules/products/products.routes';
import cartRoutes from './modules/cart/cart.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import orderRoutes from './modules/orders/orders.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';
import paymentRoutes from './modules/payments/payments.routes';
import { stripeWebhook } from './modules/payments/payments.controller';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// ─────────────────────────────────────────────────────────────────
// Trust proxy (required for rate limiter in production)
// ─────────────────────────────────────────────────────────────────

// When deployed behind a reverse proxy (Vercel, Railway, etc.),
// we need this so req.ip returns the real client IP, not the proxy's.
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })
);

app.use(
  cors({
    origin: [env.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────────────────
// ⚠️  STRIPE WEBHOOK — MUST COME BEFORE express.json()
// ─────────────────────────────────────────────────────────────────
//
// Stripe sends webhook payloads as raw JSON, and we must verify the
// signature against the EXACT raw bytes received. If express.json()
// parsed the body first, the original bytes would be lost and
// signature verification would always fail.
//
// We mount this route here, before any body-parsing middleware, and
// use express.raw() to keep req.body as a Buffer for this single route.
//
// All OTHER routes still get express.json() applied below.
// ─────────────────────────────────────────────────────────────────

app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ─────────────────────────────────────────────────────────────────
// Request Parsing Middleware
// ─────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─────────────────────────────────────────────────────────────────
// Logging Middleware
// ─────────────────────────────────────────────────────────────────

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─────────────────────────────────────────────────────────────────
// Health Check (no rate limit)
// ─────────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '0.0.1',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Apply general rate limiter to all API routes
// ─────────────────────────────────────────────────────────────────

app.use('/api/v1', apiLimiter);

// ─────────────────────────────────────────────────────────────────
// API v1 Root
// ─────────────────────────────────────────────────────────────────

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'LuxeCart API v1',
    modules: [
      'auth',
      'users',
      'addresses',
      'categories',
      'products',
      'cart',
      'wishlist',
      'orders',
      'reviews',
      'notifications',
      'admin',
      'payments',
    ],
  });
});

// ─────────────────────────────────────────────────────────────────
// API v1 Routes (all 11 modules)
// ─────────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);

// ─────────────────────────────────────────────────────────────────
// 404 Handler (after all routes)
// ─────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested resource does not exist',
    code: 'NOT_FOUND',
  });
});

// ─────────────────────────────────────────────────────────────────
// Global Error Handler (MUST BE LAST)
// ─────────────────────────────────────────────────────────────────

app.use(errorHandler);

export default app;