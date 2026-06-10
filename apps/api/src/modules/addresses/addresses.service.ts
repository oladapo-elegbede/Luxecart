import { prisma } from '../../config/database';
import {
  NotFoundError,
  AuthorizationError,
} from '../../shared/errors/HttpError';
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from './addresses.validator';
import type { Address } from '@prisma/client';

/**
 * Addresses Service.
 *
 * Business logic for managing user shipping/billing addresses.
 *
 * KEY SECURITY PATTERN:
 * Every function takes BOTH userId AND addressId.
 * We verify the address belongs to the user before any operation.
 * This prevents IDOR (Insecure Direct Object Reference) attacks where
 * an attacker tries to access/modify someone else's address by guessing
 * UUIDs.
 */

/**
 * Get all addresses for a user.
 *
 * Returns addresses sorted by:
 * 1. Default first (so it's at the top of the list)
 * 2. Most recently created next
 */
export async function listAddresses(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Get a single address by ID.
 *
 * Verifies the address belongs to the user (IDOR protection).
 */
export async function getAddressById(
  userId: string,
  addressId: string
): Promise<Address> {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new NotFoundError('Address');
  }

  // IDOR check — confirm this address belongs to the user
  if (address.userId !== userId) {
    throw new AuthorizationError('You do not have access to this address');
  }

  return address;
}

/**
 * Create a new address for a user.
 *
 * SPECIAL CASE: If isDefault is true, we must also set ALL OTHER addresses
 * to isDefault=false. A user can only have ONE default address at a time.
 *
 * We use a transaction so both operations succeed or both fail together.
 *
 * SPECIAL CASE: If this is the FIRST address being created, automatically
 * mark it as default (a user with one address should have it default).
 */
export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  // Check if user has any existing addresses
  const existingCount = await prisma.address.count({
    where: { userId },
  });

  // If this is the first address, force it to be default
  const shouldBeDefault = existingCount === 0 ? true : input.isDefault === true;

  // Convert empty strings to null for optional fields
  const data = {
    userId,
    firstName: input.firstName,
    lastName: input.lastName,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 === '' ? null : input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    phone: input.phone === '' ? null : input.phone ?? null,
    isDefault: shouldBeDefault,
  };

  // If new address is default, unset other defaults in a transaction
  if (shouldBeDefault && existingCount > 0) {
    const [, newAddress] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.create({ data }),
    ]);
    return newAddress;
  }

  return prisma.address.create({ data });
}

/**
 * Update an existing address.
 *
 * Verifies ownership before update (IDOR protection).
 * Handles the isDefault flag the same way as create.
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  // Verify the address exists and belongs to the user
  await getAddressById(userId, addressId);

  // Build update data, handling empty strings
  const data: Record<string, string | boolean | null> = {};

  if (input.firstName !== undefined) data['firstName'] = input.firstName;
  if (input.lastName !== undefined) data['lastName'] = input.lastName;
  if (input.addressLine1 !== undefined) data['addressLine1'] = input.addressLine1;
  if (input.addressLine2 !== undefined) {
    data['addressLine2'] = input.addressLine2 === '' ? null : input.addressLine2;
  }
  if (input.city !== undefined) data['city'] = input.city;
  if (input.state !== undefined) data['state'] = input.state;
  if (input.postalCode !== undefined) data['postalCode'] = input.postalCode;
  if (input.country !== undefined) data['country'] = input.country;
  if (input.phone !== undefined) {
    data['phone'] = input.phone === '' ? null : input.phone;
  }
  if (input.isDefault !== undefined) data['isDefault'] = input.isDefault;

  // If setting as default, unset other defaults
  if (input.isDefault === true) {
    const [, updated] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data,
      }),
    ]);
    return updated;
  }

  return prisma.address.update({
    where: { id: addressId },
    data,
  });
}

/**
 * Delete an address.
 *
 * Verifies ownership before delete (IDOR protection).
 *
 * SPECIAL CASE: If the deleted address was the default AND other addresses
 * exist, promote the most recent address to be the new default.
 */
export async function deleteAddress(
  userId: string,
  addressId: string
): Promise<void> {
  // Verify ownership
  const address = await getAddressById(userId, addressId);

  await prisma.address.delete({
    where: { id: addressId },
  });

  // If we just deleted the default, promote another address
  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }
}

/**
 * Set an address as default.
 *
 * Convenience endpoint that explicitly marks an address as default
 * and unsets all others. Cleaner than using PATCH with isDefault: true.
 */
export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<Address> {
  // Verify ownership
  await getAddressById(userId, addressId);

  // In one transaction: unset all defaults, set this one as default
  const [, updated] = await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  return updated;
}