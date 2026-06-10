import { z } from 'zod';

/**
 * Addresses Validators.
 *
 * Zod schemas for address CRUD operations.
 *
 * Country uses ISO 3166-1 alpha-2 codes (e.g., 'US', 'GB', 'NG').
 * Two characters, uppercase. Industry standard.
 */

/**
 * Reusable address field rules.
 * Used in both create and update schemas.
 */
const addressFields = {
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .trim(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long')
    .trim(),

  addressLine1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 is too long')
    .trim(),

  addressLine2: z
    .string()
    .max(255, 'Address line 2 is too long')
    .trim()
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City is too long')
    .trim(),

  state: z
    .string()
    .min(1, 'State is required')
    .max(100, 'State is too long')
    .trim(),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code is too long')
    .trim(),

  country: z
    .string()
    .length(2, 'Country must be a 2-letter ISO code (e.g., US, GB, NG)')
    .toUpperCase(),

  phone: z
    .string()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(
      /^[+]?[\d\s()-]+$/,
      'Phone number can only contain digits, spaces, +, -, and parentheses'
    )
    .optional()
    .or(z.literal('')),

  isDefault: z.boolean().optional(),
};

/**
 * Create address validator.
 *
 * All required fields must be present.
 * .strict() prevents injection of unknown fields.
 */
export const createAddressSchema = z.object(addressFields).strict();

/**
 * Update address validator.
 *
 * All fields optional (partial update).
 * At least one field must be provided.
 */
export const updateAddressSchema = z
  .object({
    firstName: addressFields.firstName.optional(),
    lastName: addressFields.lastName.optional(),
    addressLine1: addressFields.addressLine1.optional(),
    addressLine2: addressFields.addressLine2,
    city: addressFields.city.optional(),
    state: addressFields.state.optional(),
    postalCode: addressFields.postalCode.optional(),
    country: addressFields.country.optional(),
    phone: addressFields.phone,
    isDefault: addressFields.isDefault,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Address ID validator (for URL params).
 *
 * UUIDs are 36 characters with specific format.
 * Validating prevents SQL-like injection attacks via URL.
 */
export const addressIdSchema = z.object({
  id: z.string().uuid('Invalid address ID format'),
});

/**
 * TypeScript types inferred from the schemas.
 */
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;