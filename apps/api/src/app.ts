import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/database';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import addressRoutes from './modules/addresses/addresses.routes';
import categoryRoutes from './modules/categories/categories.routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * Create and configure the Express application.
 *
 * WHY SEPARATE app.ts FROM server.ts?
 *
 * app.ts: Creates and configures the Express app (testable)
 * server.ts: Starts the HTTP server (not imported in tests)
 *
 * In tests, we import app.ts and use supertest to make requests.
 * We never actually start the server in tests — too slow, port conflicts.
 */
const app: Express = express();

// ─────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────

/**
 * Helmet sets 15+ security-related HTTP headers.
 *
 * X-Content-Type-Options: nosniff — Prevents MIME sniffing attacks
 * X-Frame-Options: DENY — Prevents clickjacking
 * Strict-Transport-Security — Forces HTTPS (production only)
 * Content-Security-Policy — Controls which resources can load
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })
);

/**
 * CORS Configuration.
 *
 * Only allow requests from our frontend domain.
 * credentials: true — allows cookies to be sent cross-origin.
 *   Required for our httpOnly refresh token cookie.
 */
app.use(
  cors({
    origin: [env.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────
// Request Parsing Middleware
// ─────────────────────────────────────────

/**
 * Parse JSON request bodies.
 * limit: '10mb' — prevents large payload attacks (DoS).
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Parse URL-encoded request bodies (form submissions).
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Parse Cookie header and populate req.cookies.
 * Used to read our httpOnly refresh token cookie.
 */
app.use(cookieParser());

/**
 * Compress all responses using gzip.
 * Reduces bandwidth usage by 70-80% for JSON responses.
 */
app.use(compression());

// ─────────────────────────────────────────
// Logging Middleware
// ─────────────────────────────────────────

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────

/**
 * Health check endpoint.
 *
 * Required for:
 * - Load balancers (they ping this to check if server is alive)
 * - Docker health checks
 * - Kubernetes readiness probes
 * - Monitoring dashboards
 *
 * This endpoint also tests the database connection with a simple query.
 * Returns 200 if everything is healthy, 503 if database is unreachable.
 */
app.get('/health', async (_req, res) => {
  try {
    // Test database connectivity with a minimal query
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

// ─────────────────────────────────────────
// API v1 Root
// ─────────────────────────────────────────

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'LuxeCart API v1',
  });
});

// ─────────────────────────────────────────
// API v1 Routes (modules)
// ─────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/categories', categoryRoutes);

// ─────────────────────────────────────────
// 404 Handler (after all routes)
// ─────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested resource does not exist',
    code: 'NOT_FOUND',
  });
});

// ─────────────────────────────────────────
// Global Error Handler (MUST BE LAST)
// ─────────────────────────────────────────

app.use(errorHandler);

export default app;