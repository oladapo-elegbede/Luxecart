/**
 * Shared TypeScript types matching our backend API responses.
 *
 * These mirror the Prisma models and API response shapes from the backend.
 * Keep them in sync if you change the backend schema.
 *
 * NOTE: Prisma's Decimal type comes through JSON as a string.
 * Always treat price-like fields as STRINGS when reading from API.
 */

// ─────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─────────────────────────────────────────
// Category Types
// ─────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithDetails extends Category {
  children?: Category[];
  _count?: {
    products: number;
  };
}

// ─────────────────────────────────────────
// Product Types
// ─────────────────────────────────────────

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  sku: string;
  priceModifier: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  lowStockThreshold: number;
  categoryId: string;
  status: ProductStatus;
  weight: string | null;
  tags: string[];
  averageRating: string;
  reviewCount: number;
  viewCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

// ─────────────────────────────────────────
// Address Types
// ─────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// Cart Types
// ─────────────────────────────────────────

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
  variant: ProductVariant | null;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}

// ─────────────────────────────────────────
// Wishlist Types
// ─────────────────────────────────────────

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface Wishlist {
  id: string;
  userId: string;
  createdAt: string;
  items: WishlistItem[];
  itemCount: number;
}

// ─────────────────────────────────────────
// Order Types
// ─────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productImage: string | null;
  variantName: string | null;
  unitPrice: string;
  quantity: number;
  total: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string | null;
  subtotal: string;
  shippingCost: string;
  tax: string;
  discount: string;
  total: string;
  notes: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

// ─────────────────────────────────────────
// Review Types
// ─────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

// ─────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────

export type NotificationType =
  | 'ORDER_UPDATE'
  | 'PROMOTION'
  | 'REVIEW_RESPONSE'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────
// Pagination & API Response Types
// ─────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Array<{ field?: string; message: string }>;
}