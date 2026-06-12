"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Loader2,
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Footer } from '@/components/common/footer';
import { useAuthStore } from '@/stores/auth-store';
import { getOrder, cancelOrder } from '@/lib/api/orders';
import { getErrorMessage } from '@/lib/api-client';
import type { OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'outline',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${params.id}`);
    }
  }, [isHydrated, isAuthenticated, router, params.id]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => getOrder(params.id),
    enabled: !!params.id && isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(params.id),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (!isHydrated || !isAuthenticated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Button asChild className="mt-6">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const canCancel = order.status === 'PENDING';

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-4xl">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3">
          <Link href="/orders">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <Badge variant={STATUS_VARIANTS[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {orderDate}
            </p>
          </div>

          {canCancel && (
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel order {order.orderNumber} and restore the items to stock. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      'Yes, Cancel Order'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Status timeline */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Status</h2>
          <StatusTimeline order={order} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Items + Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">
                Items ({order.items?.length ?? 0})
              </h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Qty {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium whitespace-nowrap">
                      ${parseFloat(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h2>
              <div className="text-sm space-y-0.5">
                <p className="font-medium">
                  {order.shippingFirstName} {order.shippingLastName}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddressLine1}
                  {order.shippingAddressLine2 && <>, {order.shippingAddressLine2}</>}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </p>
                <p className="text-muted-foreground">{order.shippingCountry}</p>
                {order.shippingPhone && (
                  <p className="text-muted-foreground">{order.shippingPhone}</p>
                )}
              </div>

              {order.trackingNumber && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-1">Tracking Number</p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {order.trackingNumber}
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card className="p-6">
                <h2 className="font-semibold mb-2">Order Notes</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {order.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Right: Summary */}
          <div>
            <Card className="p-6 lg:sticky lg:top-24">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {parseFloat(order.shippingCost) === 0
                      ? 'FREE'
                      : `$${parseFloat(order.shippingCost).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -${parseFloat(order.discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">Payment Status</p>
                <Badge
                  variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function StatusTimeline({
  order,
}: {
  order: { status: OrderStatus; shippedAt: string | null; deliveredAt: string | null; cancelledAt: string | null };
}) {
  const isCancelled = order.status === 'CANCELLED';
  const isRefunded = order.status === 'REFUNDED';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 text-destructive">
        <XCircle className="h-5 w-5" />
        <div>
          <p className="font-medium">Order cancelled</p>
          {order.cancelledAt && (
            <p className="text-sm text-muted-foreground">
              {new Date(order.cancelledAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isRefunded) {
    return (
      <div className="flex items-center gap-3">
        <RotateCcw className="h-5 w-5 text-muted-foreground" />
        <p className="font-medium">Order refunded</p>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Pending', icon: Package },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  ] as const;

  const currentIdx = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isComplete = idx <= currentIdx;
        const isActive = idx === currentIdx;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  isComplete
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                } ${isActive ? 'ring-4 ring-primary/20' : ''}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p
                className={`text-xs mt-2 text-center ${
                  isComplete ? 'font-semibold' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-6 ${
                  idx < currentIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}