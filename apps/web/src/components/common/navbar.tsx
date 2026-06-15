'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { CartIcon } from './cart-icon';
import { UserMenu } from './user-menu';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Main Navigation Bar.
 *
 * Sticky at the top of every page.
 * Shows different states based on scroll position and auth state.
 *
 * STRUCTURE (desktop):
 *   [Logo]  [Nav Links]  [Search] [Wishlist] [Cart] [Theme] [User]
 *
 * STRUCTURE (mobile):
 *   [Logo]  [Search] [Cart] [Menu Hamburger]
 *
 * BEHAVIOR:
 *   - Sticky with backdrop blur when scrolled
 *   - Clean glass effect on scroll
 *   - Responsive: nav links hidden on mobile, shown in menu drawer
 *
 * SSR / HYDRATION NOTE:
 * We DO NOT read `isAuthenticated` directly during the first render,
 * because the auth state lives in localStorage (only available on the
 * client). Reading it on the server would return `false`, then `true`
 * after the Zustand store hydrates — causing a React hydration mismatch.
 *
 * Instead, we gate auth-dependent UI on `isHydrated`. Before hydration,
 * we render the SAME thing the server rendered (no wishlist button).
 * After hydration, we re-render with the correct auth state.
 */
const NAV_LINKS = [
  { href: '/products', label: 'Shop All' },
  { href: '/categories/electronics', label: 'Electronics' },
  { href: '/categories/fashion', label: 'Fashion' },
  { href: '/categories/home-living', label: 'Home' },
];

export function Navbar() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Only show auth-dependent UI AFTER store has hydrated from localStorage.
  // Before hydration, render the "logged-out" version to match SSR output.
  const showAuthUI = isHydrated && isAuthenticated;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'border-b border-border/40 bg-background/80 backdrop-blur-md'
          : 'bg-background'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        {/* Right: Icons + Actions */}
        <div className="flex items-center gap-1">
          {/* Search button — modal coming later */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search products"
            className="hidden sm:flex"
            asChild
          >
            <Link href="/products">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {/* Wishlist (only if logged in, after hydration to avoid SSR mismatch) */}
          {showAuthUI && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              asChild
              className="hidden sm:flex"
            >
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Cart */}
          <CartIcon />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu / Sign in */}
          <div className="ml-1">
            <UserMenu />
          </div>

          {/* Mobile menu trigger — drawer coming later */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-1"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}