import { z } from 'zod';

/**
 * Categories Validators.
 *
 * Categories support nesting (parent → children) for sub-categories.
 * Example: Electronics > Phones > Smartphones
 *
 * SLUG: URL-friendly version of the name.
 * Example: "Home & Living" → "home-living"
 * Used in public-facing URLs like /categories/home-living
 */

/**
 * Slug validation pattern.
 *
 * Must be lowercase, alphanumeric, with hyphens.
 * Cannot start or end with a hyphen.
 * Cannot have consecutive hyphens.
 *
 * Valid:   "electronics", "home-living", "sports-fitness"
 * Invalid: "Electronics", "home_living", "--bad--"
 */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Create category validator (ADMIN ONLY).
 *
 * Auto-slug not implemented here — admin provides the slug explicitly.
 * In real production, you might generate slug from name automatically.
 */
export const createCategorySchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name is too long')
      .trim(),

    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(100, 'Slug is too long')
      .regex(
        slugRegex,
        'Slug must be lowercase, alphanumeric, with hyphens (e.g., "home-living")'
      ),

    description: z
      .string()
      .max(1000, 'Description is too long')
      .trim()
      .optional()
      .or(z.literal('')),

    imageUrl: z
      .string()
      .url('Image URL must be a valid URL')
      .max(2000, 'Image URL is too long')
      .optional()
      .or(z.literal('')),

    parentId: z
      .string()
      .uuid('Parent ID must be a valid UUID')
      .optional()
      .nullable(),

    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order cannot be negative')
      .max(9999, 'Display order is too large')
      .optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

/**
 * Update category validator (ADMIN ONLY).
 *
 * All fields optional (partial update).
 * At least one field must be provided.
 */
export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(slugRegex, 'Invalid slug format')
      .optional(),
    description: z.string().max(1000).trim().optional().or(z.literal('')),
    imageUrl: z.string().url().max(2000).optional().or(z.literal('')),
    parentId: z.string().uuid().optional().nullable(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Category ID validator (for URL params).
 */
export const categoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID format'),
});

/**
 * Category slug validator (for URL params on public endpoints).
 */
export const categorySlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(slugRegex, 'Invalid slug format'),
});

/**
 * Query params validator for listing categories.
 *
 * ?parent=null      → top-level categories only
 * ?parent=<uuid>    → children of a specific parent
 * ?activeOnly=true  → exclude archived categories (default: true)
 */
export const listCategoriesQuerySchema = z.object({
  parent: z
    .union([z.literal('null'), z.string().uuid('Invalid parent ID')])
    .optional(),
  activeOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional(),
});

/**
 * TypeScript types inferred from the schemas.
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;