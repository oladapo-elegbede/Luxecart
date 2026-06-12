import Link from 'next/link';
import { Logo } from './logo';

/**
 * Footer.
 *
 * Site-wide footer with brand, navigation, and legal links.
 * Appears on every page (added to root layout).
 */

const FOOTER_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { href: '/products', label: 'All Products' },
      { href: '/categories/electronics', label: 'Electronics' },
      { href: '/categories/fashion', label: 'Fashion' },
      { href: '/categories/home-living', label: 'Home & Living' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/orders', label: 'My Orders' },
      { href: '/wishlist', label: 'Wishlist' },
      { href: '/profile', label: 'Profile' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: '/careers', label: 'Careers' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/shipping', label: 'Shipping Info' },
      { href: '/returns', label: 'Returns' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">
              Premium shopping, reimagined. Discover curated products with exceptional quality and service.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-semibold text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LuxeCart. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, Express, PostgreSQL & TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}