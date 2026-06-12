"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Heart,
  MapPin,
  User as UserIcon,
  ShoppingBag,
  ChevronRight,
  Loader2,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/common/footer';
import { useAuthStore } from '@/stores/auth-store';
import { listOrders } from '@/lib/api/orders';
import { getWishlist } from '@/lib/api/wishlist';
import { listAddresses } from '@/lib/api/addresses';
import type { OrderStatus } from '@/types';

/**
 * Dashboard Page (/dashboard).
 *
 * The post-login home page for the customer.
 *
 * Sections:
 *   1. Welcome card with personalized greeting
 *   2. Stats grid (orders, wishlist, addresses)
 *   3. Recent orders preview (max 3)
 *   4. Quick action cards
 */

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'outline',
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isHydrated = useAuthStore((state) => state.isHydrated);

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => listOrders({ page: 1, limit: 3 }),
    enabled: isAuthenticated,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: listAddresses,
    enabled: isAuthenticated,
  });

  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Personalized greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-6xl">
        {/* Welcome card */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {greeting}, {user.firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to your dashboard
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="Total Orders"
            value={ordersData?.pagination.total ?? 0}
            href="/orders"
          />
          <StatCard
            icon={Heart}
            label="Wishlist"
            value={wishlist?.itemCount ?? 0}
            href="/wishlist"
          />
          <StatCard
            icon={MapPin}
            label="Addresses"
            value={addresses?.length ?? 0}
            href="/addresses"
          />
          <StatCard
            icon={UserIcon}
            label="Account"
            value={user.isVerified ? 'Verified' : 'Active'}
            href="/profile"
          />
        </div>

        {/* Recent orders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            {ordersData && ordersData.orders.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">
                  View All
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {ordersData && ordersData.orders.length > 0 ? (
            <div className="space-y-3">
              {ordersData.orders.slice(0, 3).map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                );
                const itemCount = order.items?.length ?? 0;
                const firstFew = order.items?.slice(0, 3) ?? [];

                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card className="p-4 hover:border-foreground/30 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        {/* Item thumbnails */}
                        <div className="flex -space-x-2 shrink-0">
                          {firstFew.map((item) => (
                            <div
                              key={item.id}
                              className="relative h-12 w-12 overflow-hidden rounded-md border-2 border-background bg-muted"
                            >
                              {item.productImage && (
                                <Image
                                  src={item.productImage}
                                  alt={item.productName}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm font-semibold truncate">
                              {order.orderNumber}
                            </p>
                            <Badge
                              variant={STATUS_VARIANTS[order.status]}
                              className="text-xs shrink-0"
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {orderDate} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </p>
                        </div>

                        {/* Total + arrow */}
                        <div className="text-right shrink-0">
                          <p className="font-semibold">
                            ${parseFloat(order.total).toFixed(2)}
                          </p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start shopping to see your orders here.
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              href="/products"
              icon={ShoppingBag}
              title="Continue Shopping"
              description="Browse our latest products"
            />
            <QuickActionCard
              href="/wishlist"
              icon={Heart}
              title="View Wishlist"
              description="See items you've saved for later"
            />
            <QuickActionCard
              href="/addresses"
              icon={MapPin}
              title="Manage Addresses"
              description="Update your shipping addresses"
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

/**
 * Stat card with icon, label, value, and link.
 */
function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:border-foreground/30 transition-colors cursor-pointer h-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-lg leading-tight">{value}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Quick action card with icon, title, description.
 */
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-foreground/30 transition-colors group cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </Card>
    </Link>
  );
}