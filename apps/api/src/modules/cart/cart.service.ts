import { prisma } from '../../config/database';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
} from '../../shared/errors/HttpError';
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from './cart.validator';


/**
 * Cart Service.
 *
 * Business logic for the shopping cart.
 *
 * KEY BEHAVIORS:
 *   1. Auto-create cart if user doesn't have one
 *      (Normally created on registration, but safe fallback.)
 *
 *   2. Merge duplicate items
 *      Adding the same (product, variant) increments quantity instead of
 *      creating a duplicate row.
 *
 *   3. Stock validation
 *      Cannot add more than available stock.
 *      Cannot exceed product OR variant stock (variant takes precedence).
 *
 *   4. Calculate totals
 *      Subtotal returned with cart for UI display.
 *      No tax/shipping here — those come at checkout.
 */

/**
 * Get user's cart with all items and computed totals.
 *
 * Creates an empty cart if the user doesn't have one yet.
 * Returns rich data: items with product info + computed subtotal.
 */
export async function getCart(userId: string) {
  // Get or create the cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: 'asc' },
                take: 1,
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          variant: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                },
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Compute totals
  const subtotal = cart.items.reduce((sum, item) => {
    const basePrice = Number(item.product.price);
    const modifier = item.variant ? Number(item.variant.priceModifier) : 0;
    return sum + (basePrice + modifier) * item.quantity;
  }, 0);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...cart,
    subtotal: subtotal.toFixed(2),
    itemCount,
  };
}

/**
 * Add an item to the cart.
 *
 * Validation:
 *   1. Product must exist and be ACTIVE
 *   2. If variantId provided, variant must belong to that product
 *   3. Stock must be sufficient for the requested quantity
 *      (Including any existing quantity for the same item.)
 *
 * If same (productId, variantId) already in cart, increment quantity.
 */
export async function addItemToCart(
  userId: string,
  input: AddCartItemInput
): Promise<void> {
  const quantityToAdd = input.quantity ?? 1;

  // 1. Verify product exists and is purchasable
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  if (product.status !== 'ACTIVE') {
    throw new ValidationError('This product is not available for purchase');
  }

  // 2. If variant specified, verify it belongs to the product
  let variantStock = product.stock;
  if (input.variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
    });

    if (!variant) {
      throw new NotFoundError('Variant');
    }

    if (variant.productId !== input.productId) {
      throw new ValidationError('Variant does not belong to this product');
    }

    variantStock = variant.stock;
  }

  // 3. Ensure cart exists (create if needed)
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  // 4. Check if same item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: input.productId,
      variantId: input.variantId ?? null,
    },
  });

  // 5. Calculate total quantity (existing + adding)
  const totalQuantity = (existingItem?.quantity ?? 0) + quantityToAdd;

  // 6. Validate against stock
  if (totalQuantity > variantStock) {
    throw new ConflictError(
      `Insufficient stock. Only ${variantStock} available, you're trying to add ${totalQuantity}.`
    );
  }

  // 7. Either update existing or create new
  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: totalQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: quantityToAdd,
      },
    });
  }
}

/**
 * Update the quantity of an existing cart item.
 *
 * Validation:
 *   - Item must exist
 *   - Item must belong to the user's cart (IDOR protection)
 *   - New quantity cannot exceed available stock
 */
export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<void> {
  // Get the item with product/variant for stock check
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
      product: true,
      variant: true,
    },
  });

  if (!item) {
    throw new NotFoundError('Cart item');
  }

  // IDOR check
  if (item.cart.userId !== userId) {
    throw new AuthorizationError('This item is not in your cart');
  }

  // Stock check
  const availableStock = item.variant ? item.variant.stock : item.product.stock;
  if (input.quantity > availableStock) {
    throw new ConflictError(
      `Insufficient stock. Only ${availableStock} available.`
    );
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: input.quantity },
  });
}

/**
 * Remove a single item from the cart.
 *
 * IDOR-protected: only the cart owner can remove items.
 */
export async function removeCartItem(
  userId: string,
  itemId: string
): Promise<void> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item) {
    throw new NotFoundError('Cart item');
  }

  if (item.cart.userId !== userId) {
    throw new AuthorizationError('This item is not in your cart');
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });
}

/**
 * Clear all items from the user's cart.
 *
 * Does NOT delete the cart itself — just empties it.
 * Used after successful checkout, or when user clicks "Clear Cart".
 */
export async function clearCart(userId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    // No cart = nothing to clear, silent success
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
}