import type { NextConfig } from 'next';

/**
 * Next.js Configuration for LuxeCart
 *
 * Using stable Webpack bundler (Turbopack has monorepo issues in v16).
 * We can migrate to Turbopack in a future phase when it stabilizes.
 */
const nextConfig: NextConfig = {
  // Strict mode catches bugs early in development
  reactStrictMode: true,

  // Hide the X-Powered-By header (security best practice)
  poweredByHeader: false,

  // Configure allowed external image sources for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;