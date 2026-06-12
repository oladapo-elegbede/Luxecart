"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, Loader2, ChevronRight, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/common/footer';
import { useAuthStore } from '@/stores/auth-store';
import { listOrders } from '@/lib/api/orders';
import type { OrderStatus } from '@/types';

/**
 * Orders List Page (My Orders).
 *
 * URL: /orders
 *
 * Lists all of the customer's orders.
 * Each card shows: order number, date, status, total, item preview.
 * Clicking a card goes to /orders/[id] for full details.
 */

const STATUS_VARIANTS: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  SHIPPED: { label: 'Shipped', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'outline' },
};

export default function OrdersPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isHydrated = useAuthStore((state) => state.isHydrated);

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => listOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated,
  });

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and track your orders
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data && data.orders.length > 0 ? (
          <div className="space-y-4">
            {data.orders.map((order) => {
              const statusInfo = STATUS_VARIANTS[order.status];
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const itemCount = order.items?.length ?? 0;
              const firstFew = order.items?.slice(0, 3) ?? [];

              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="p-6 hover:border-foreground/30 transition-colors group cursor-pointer">
                    {/* Top row: order info + status */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono font-semibold text-sm">
                            {order.orderNumber}
                          </p>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Placed on {orderDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${parseFloat(order.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    {/* Item images */}
                    {firstFew.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
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
                          {itemCount > 3 && (
                            <div className="relative h-12 w-12 rounded-md border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                              +{itemCount - 3}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No orders yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              When you place your first order, it&apos;ll appear here.
            </p>
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </Card>
        )}
      </div>

      <Footer />
    </>
  );
}