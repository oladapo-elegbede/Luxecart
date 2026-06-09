import { env } from './config/env';
import app from './app';

/**
 * HTTP Server Entry Point.
 *
 * This file only starts the server.
 * All application configuration is in app.ts.
 *
 * Handles:
 * - Server startup
 * - Graceful shutdown (SIGTERM, SIGINT)
 * - Unhandled rejection catching
 */

const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.info(`
  ╔═══════════════════════════════════════╗
  ║         LuxeCart API Server           ║
  ╠═══════════════════════════════════════╣
  ║  Status:   Running ✓                  ║
  ║  Port:     ${PORT}                        ║
  ║  Env:      ${env.NODE_ENV.padEnd(12)}         ║
  ║  URL:      ${env.API_URL}      ║
  ╚═══════════════════════════════════════╝
  `);
});

/**
 * Graceful Shutdown Handler.
 *
 * WHY GRACEFUL SHUTDOWN MATTERS:
 *
 * When a deployment happens (or the process is killed),
 * SIGTERM is sent to the process. Without graceful shutdown:
 * - In-flight requests are terminated mid-response
 * - Database connections are forcibly closed
 * - Users see errors during deployments
 *
 * With graceful shutdown:
 * - Stop accepting new requests
 * - Wait for in-flight requests to complete (max 30 seconds)
 * - Close database connections cleanly
 * - Exit process
 *
 * This is required for zero-downtime deployments.
 */
const gracefulShutdown = (signal: string): void => {
  console.info(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 30 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('Could not close connections in time. Forcing shutdown.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Catch unhandled promise rejections.
 *
 * Without this, unhandled rejections print a warning and
 * may crash the process in newer Node.js versions.
 */
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

/**
 * Catch uncaught synchronous exceptions.
 *
 * The process is in an unknown state after this.
 * Always exit and let the process manager restart cleanly.
 */
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});