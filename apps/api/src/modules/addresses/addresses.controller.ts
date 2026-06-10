import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from './addresses.validator';
import {
  listAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './addresses.service';

/**
 * Addresses Controller.
 *
 * Thin HTTP layer for address CRUD operations.
 * All endpoints require authentication.
 */

/**
 * GET /api/v1/addresses
 * List all addresses for the current user.
 */
export async function listMyAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const addresses = await listAddresses(req.user.userId);

    sendSuccess(res, {
      message: 'Addresses retrieved successfully',
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/addresses/:id
 * Get a specific address by ID.
 */
export async function getOneAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate URL param
    const parsed = addressIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid address ID');
    }

    const address = await getAddressById(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Address retrieved successfully',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/addresses
 * Create a new address.
 */
export async function createMyAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate body
    const parsed = createAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const address = await createAddress(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Address created successfully',
      statusCode: 201,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/addresses/:id
 * Update an existing address.
 */
export async function updateMyAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate URL param
    const paramParsed = addressIdSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid address ID');
    }

    // Validate body
    const bodyParsed = updateAddressSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const address = await updateAddress(
      req.user.userId,
      paramParsed.data.id,
      bodyParsed.data
    );

    sendSuccess(res, {
      message: 'Address updated successfully',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/addresses/:id
 * Delete an address.
 */
export async function deleteMyAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate URL param
    const parsed = addressIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid address ID');
    }

    await deleteAddress(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/addresses/:id/default
 * Set an address as the default.
 */
export async function setMyDefaultAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = addressIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid address ID');
    }

    const address = await setDefaultAddress(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Default address updated successfully',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}