import { z } from 'zod';

/**
 * Products Validators.
 *
 * The most complex validator in our app. Handles:
 * - Search (full-text)
 * - Filters (category, price, stock, rating)
 * - Sorting (price, newest, popular, rating)
 * - Pagination (page, limit)
 *
 * All listing parameters come from URL query strings,
 * which means everything starts as a string and we coerce types.
 */

/**
 * Slug regex (same as categories — keeps URL format consistent).
 */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Sort options for product listing.
 */
const sortByOptions = [
  'price_asc',
  'price_desc',
  'newest',
  'oldest',
  'popular',
  'rating',
  'name_asc',
  'name_desc',
] as const;

/**
 * Product status enum (matches Prisma).
 */
const productStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

/**
 * Query params for listing products (PUBLIC + ADMIN).
 *
 * IMPORTANT: All query params arrive as strings, so we use coerce/transform.
 *
 * Examples:
 *   ?search=headphones&category=electronics&minPrice=50&maxPrice=300
 *   ?sortBy=price_asc&page=2&limit=20
 *   ?inStock=true&minRating=4
 *
 * The frontend will build these URLs dynamically based on user selections.
 */
export const listProductsQuerySchema = z.object({
  // Search
  search: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query is too long')
    .trim()
    .optional(),

  // Filter by category (slug for public, ID-friendly)
  category: z
    .string()
    .max(100)
    .regex(slugRegex, 'Invalid category slug format')
    .optional(),

  // Price range (coerce string from URL to number)
  minPrice: z.coerce
    .number()
    .min(0, 'Minimum price cannot be negative')
    .max(99999999, 'Minimum price is too large')
    .optional(),

  maxPrice: z.coerce
    .number()
    .min(0, 'Maximum price cannot be negative')
    .max(99999999, 'Maximum price is too large')
    .optional(),

  // Filter by rating (1-5)
  minRating: z.coerce
    .number()
    .min(1, 'Minimum rating must be at least 1')
    .max(5, 'Maximum rating is 5')
    .optional(),

  // Filter: in stock only
  inStock: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((val) => val === 'true'),

  // Status filter (admin sees DRAFT/ARCHIVED, public only sees ACTIVE)
  status: productStatusEnum.optional(),

  // Sort options
  sortBy: z.enum(sortByOptions).optional().default('newest'),

  // Pagination
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number is too large')
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

/**
 * Create product validator (ADMIN ONLY).
 */
export const createProductSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .trim(),

    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(255, 'Slug is too long')
      .regex(slugRegex, 'Invalid slug format'),

    description: z
      .string()
      .min(1, 'Description is required')
      .max(10000, 'Description is too long'),

    shortDescription: z
      .string()
      .max(500, 'Short description is too long')
      .trim()
      .optional()
      .or(z.literal('')),

    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(100, 'SKU is too long')
      .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens'),

    price: z
      .number()
      .min(0, 'Price cannot be negative')
      .max(99999999, 'Price is too large'),

    compareAtPrice: z
      .number()
      .min(0)
      .max(99999999)
      .optional()
      .nullable(),

    stock: z
      .number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .max(999999, 'Stock value is too large')
      .optional()
      .default(0),

    lowStockThreshold: z
      .number()
      .int()
      .min(0)
      .max(99999)
      .optional()
      .default(10),

    categoryId: z.string().uuid('Invalid category ID'),

    status: productStatusEnum.optional().default('DRAFT'),

    weight: z
      .number()
      .min(0)
      .max(999999.99)
      .optional()
      .nullable(),

    tags: z
      .array(z.string().max(50))
      .max(20, 'Maximum 20 tags allowed')
      .optional()
      .default([]),
  })
  .strict()
  .refine(
    (data) =>
      data.compareAtPrice === undefined ||
      data.compareAtPrice === null ||
      data.compareAtPrice > data.price,
    {
      message: 'Compare-at price must be greater than the current price',
      path: ['compareAtPrice'],
    }
  );

/**
 * Update product validator (ADMIN ONLY).
 * All fields optional, at least one required.
 */
export const updateProductSchema = z
  .object({
    name: z.string().min(1).max(255).trim().optional(),
    slug: z.string().min(1).max(255).regex(slugRegex).optional(),
    description: z.string().min(1).max(10000).optional(),
    shortDescription: z.string().max(500).trim().optional().or(z.literal('')),
    sku: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens')
      .optional(),
    price: z.number().min(0).max(99999999).optional(),
    compareAtPrice: z.number().min(0).max(99999999).optional().nullable(),
    stock: z.number().int().min(0).max(999999).optional(),
    lowStockThreshold: z.number().int().min(0).max(99999).optional(),
    categoryId: z.string().uuid().optional(),
    status: productStatusEnum.optional(),
    weight: z.number().min(0).max(999999.99).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Product ID validator (for URL params).
 */
export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

/**
 * Product slug validator (for public URL params).
 */
export const productSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(slugRegex, 'Invalid slug format'),
});

/**
 * TypeScript types inferred from schemas.
 */
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;