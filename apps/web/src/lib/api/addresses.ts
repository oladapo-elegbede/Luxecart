import { api } from '@/lib/api-client';
import type { Address, ApiSuccessResponse } from '@/types';

/**
 * Addresses API Helpers.
 *
 * All endpoints require authentication.
 * Backend enforces IDOR — users can only access their own addresses.
 */

export interface CreateAddressInput {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

/**
 * List all of the current user's addresses.
 *
 * Sorted with default first, then most recent.
 */
export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get<ApiSuccessResponse<{ addresses: Address[] }>>(
    '/addresses'
  );
  return data.data.addresses;
}

/**
 * Get a specific address by ID.
 */
export async function getAddress(addressId: string): Promise<Address> {
  const { data } = await api.get<ApiSuccessResponse<{ address: Address }>>(
    `/addresses/${addressId}`
  );
  return data.data.address;
}

/**
 * Create a new address.
 *
 * If isDefault is true, all other addresses are unset as default.
 * If this is the user's first address, it's auto-marked as default.
 */
export async function createAddress(
  input: CreateAddressInput
): Promise<Address> {
  const { data } = await api.post<ApiSuccessResponse<{ address: Address }>>(
    '/addresses',
    input
  );
  return data.data.address;
}

/**
 * Update an existing address.
 *
 * Partial update — only the fields you provide will change.
 */
export async function updateAddress(
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  const { data } = await api.patch<ApiSuccessResponse<{ address: Address }>>(
    `/addresses/${addressId}`,
    input
  );
  return data.data.address;
}

/**
 * Delete an address.
 *
 * If you delete the default address and others exist,
 * the next-most-recent address is auto-promoted to default.
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/addresses/${addressId}`);
}

/**
 * Set an address as the default.
 *
 * Atomically unsets all other defaults and sets this one.
 */
export async function setDefaultAddress(addressId: string): Promise<Address> {
  const { data } = await api.patch<ApiSuccessResponse<{ address: Address }>>(
    `/addresses/${addressId}/default`
  );
  return data.data.address;
}