"use client";
export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { verifyEmail } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api-client';

/**
 * Verify Email Page.
 *
 * URL: /verify-email?token=xyz
 *
 * Auto-verifies when the page loads (token from URL).
 * Three states:
 *   1. VERIFYING — Loading spinner
 *   2. SUCCESS — Confirmation + Continue button
 *   3. ERROR — Helpful message + Resend option
 */

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const mutation = useMutation({
    mutationFn: verifyEmail,
  });

  // Auto-trigger verification on mount
  React.useEffect(() => {
    if (token && mutation.isIdle) {
      mutation.mutate({ token });
    }
    // We intentionally only run this once when the token is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─────────────────────────────────────────
  // No token in URL
  // ─────────────────────────────────────────
  if (!token) {
    return (
      <PageShell>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Missing token</CardTitle>
            <CardDescription>
              This verification link is incomplete. Please use the link from your email.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // ─────────────────────────────────────────
  // Verifying (loading)
  // ─────────────────────────────────────────
  if (mutation.isPending || mutation.isIdle) {
    return (
      <PageShell>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifying your email…</CardTitle>
            <CardDescription>
              This will only take a moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageShell>
    );
  }

  // ─────────────────────────────────────────
  // Success
  // ─────────────────────────────────────────
  if (mutation.isSuccess) {
    return (
      <PageShell>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Email verified!</CardTitle>
            <CardDescription>
              Your email address has been confirmed. You can now enjoy full access to LuxeCart.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              Continue to Dashboard
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  // ─────────────────────────────────────────
  // Error
  // ─────────────────────────────────────────
  return (
    <PageShell>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
          <CardDescription>
            {getErrorMessage(mutation.error)}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Common reasons:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The link has already been used</li>
              <li>The link has expired (links last 24 hours)</li>
              <li>The link was copied incorrectly</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/resend-verification">
              <Mail className="mr-2 h-4 w-4" />
              Request New Link
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

/**
 * Shared layout wrapper for all states.
 */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}