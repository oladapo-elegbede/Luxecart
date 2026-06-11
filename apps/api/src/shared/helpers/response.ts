import type { Response } from 'express';

/**
 * Standardized API response helpers.
 *
 * Every successful response uses sendSuccess().
 * Every error response goes through the error handler
 * which uses sendError().
 *
 * This ensures 100% consistency in API responses.
 * Frontend code can always rely on the same shape.
 */

export interface PaginationMeta  {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SuccessResponseOptions {
  message?: string;
  data?: unknown;
  pagination?: PaginationMeta;
  statusCode?: number;
}

interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Send a standardized success response.
 *
 * @example
 * sendSuccess(res, {
 *   message: 'Product created successfully',
 *   data: { product },
 *   statusCode: 201,
 * });
 */
export function sendSuccess(
  res: Response,
  options: SuccessResponseOptions = {}
): Response {
  const {
    message = 'Success',
    data,
    pagination,
    statusCode = 200,
  } = options;

  const responseBody: Record<string, unknown> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    responseBody['data'] = data;
  }

  if (pagination !== undefined) {
    responseBody['pagination'] = pagination;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * Send a standardized error response.
 *
 * Called by the global error handler middleware.
 * Never called directly in controllers.
 */
export function sendError(
  res: Response,
  options: {
    message: string;
    errors?: ErrorDetail[];
    code: string;
    statusCode: number;
  }
): Response {
  const { message, errors, code, statusCode } = options;

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
    code,
  };

  if (errors && errors.length > 0) {
    responseBody['errors'] = errors;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * Calculate pagination metadata.
 *
 * @example
 * const pagination = paginate({ total: 150, page: 1, limit: 20 });
 */
export function paginate(options: {
  total: number;
  page: number;
  limit: number;
}): PaginationMeta {
  const { total, page, limit } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}