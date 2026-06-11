import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

/**
 * LuxeCart Logo.
 *
 * Used in navbar and footer. Always wraps in a link to home.
 *
 * Design:
 *   - Shopping bag icon (custom brand mark)
 *   - "LuxeCart" wordmark in gradient text
 *   - Clean, premium typography (Geist font from layout)
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 group ${className}`}
      aria-label="LuxeCart — Home"
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sm transition-transform group-hover:scale-105">
        <ShoppingBag className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        LuxeCart
      </span>
    </Link>
  );
}