import type { TokenPayload } from '../helpers/token';

/**
 * Express Type Augmentation.
 *
 * Extends Express's built-in Request type to include our custom properties.
 *
 * WHY THIS FILE?
 * Express doesn't know about our authentication system. By default,
 * `req.user` doesn't exist on the Request type.
 *
 * After our auth middleware runs and attaches the user, we need
 * TypeScript to know that `req.user` is available downstream.
 *
 * This is called "module augmentation" — adding properties to a
 * third-party module's types without modifying the original code.
 *
 * The `.d.ts` extension tells TypeScript this is a declaration-only file
 * (no runtime code). It's automatically included by the compiler.
 */

declare global {
  namespace Express {
    /**
     * Extended Request interface with authenticated user data.
     *
     * Available on protected routes AFTER the `authenticate` middleware runs.
     * Optional (?:) because the property is only set on protected routes.
     */
    interface Request {
      user?: TokenPayload;
    }
  }
}

// This export statement makes the file a "module"
// Required for `declare global` to work correctly
export {};