import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthBootstrap } from '@/providers/auth-bootstrap';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/common/navbar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'LuxeCart — Premium Shopping, Reimagined',
    template: '%s | LuxeCart',
  },
  description:
    'A production-grade e-commerce platform featuring curated premium products with world-class shopping experience.',
  keywords: ['ecommerce', 'shopping', 'premium products', 'luxury', 'fashion', 'electronics'],
  authors: [{ name: 'LuxeCart' }],
  openGraph: {
    title: 'LuxeCart — Premium Shopping, Reimagined',
    description: 'Discover curated premium products with seamless shopping.',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthBootstrap />
            <Navbar />
            <main>{children}</main>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}