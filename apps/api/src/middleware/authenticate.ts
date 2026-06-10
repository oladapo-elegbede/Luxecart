import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/helpers/token';
import { AuthenticationError, AuthorizationError } from '../shared/errors/HttpError';

/**
 * Authentication Middleware.
 *
 * Verifies the JWT access token from the Authorization header.
 * If valid, attaches user info to req.user and passes control to the next handler.
 * If invalid, passes an AuthenticationError to the error handler.
 *
 * USAGE on routes:
 *   router.get('/protected', authenticate, (req, res) => {
 *     // req.user is now available with: { userId, email, role }
 *   });
 *
 * EXPECTED HEADER FORMAT:
 *   Authorization: Bearer <jwt_token>
 *
 * WHY "Bearer"?
 *   "Bearer" is the OAuth 2.0 standard prefix for token-based auth.
 *   It signals: "the bearer of this token is authorized".
 *   Industry standard for JWT-based APIs.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required');
    }

    // 2. Verify format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError(
        'Invalid authorization format. Expected: Bearer <token>'
      );
    }

    const token = parts[1];

    if (!token) {
      throw new AuthenticationError('Token is required');
    }

    // 3. Verify the JWT and extract payload
    const payload = verifyAccessToken(token);

    // 4. Attach user to request
    req.user = payload;

    // 5. Continue to the route handler
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization Middleware Factory.
 *
 * Creates a middleware that requires specific user roles.
 * Use AFTER the authenticate middleware (it relies on req.user).
 *
 * USAGE:
 *   router.delete('/admin/products/:id', authenticate, authorize('ADMIN'), handler);
 *   router.get('/orders', authenticate, authorize('CUSTOMER', 'ADMIN'), handler);
 *
 * WHY A FACTORY (function returning a function)?
 *   Lets us pass arguments at route definition time:
 *     authorize('ADMIN')           // accepts only admins
 *     authorize('CUSTOMER', 'ADMIN') // accepts either
 */
export function authorize(...allowedRoles: Array<'CUSTOMER' | 'ADMIN'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Must be authenticated first
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user's role is in the allowed list
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `This action requires one of: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}