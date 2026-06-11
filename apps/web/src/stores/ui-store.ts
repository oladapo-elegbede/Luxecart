import { create } from 'zustand';

/**
 * UI Store (Zustand).
 *
 * Holds UI state that affects multiple components:
 *   - Cart drawer open/closed
 *   - Mobile menu open/closed
 *   - Search modal open/closed
 *
 * This is for EPHEMERAL UI STATE — not data.
 * Data (cart items, products, etc.) lives in React Query.
 *
 * USAGE:
 *   const { isCartOpen, openCart, closeCart } = useUIStore();
 *   <Button onClick={openCart}>Open Cart</Button>
 */

interface UIState {
  // Cart drawer
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;

  // Search modal
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Cart
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  // Mobile menu
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Search
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));