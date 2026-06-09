/**
 * Base application error class.
 *
 * All custom errors in LuxeCart extend this class.
 * This allows us to distinguish between errors we intentionally
 * threw (AppError) and unexpected errors (plain Error).
 *
 * The global error handler checks instanceof AppError to
 * determine how to format the response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown
  ) {
    super(message);

    // Restore prototype chain (required when extending built-in classes)
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace (excludes constructor from trace)
    Error.captureStackTrace(this, this.constructor);
  }
}