"use client";

import * as React from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { resendVerification } from '@/lib/api/auth';

/**
 * Resend Verification Page.
 *
 * For users whose verification link expired or was lost.
 * Same security pattern as forgot-password:
 *   Always shows success regardless of whether email exists.
 */

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ResendVerificationPage() {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (_data, variables) => {
      setSubmittedEmail(variables.email);
    },
  });

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        {submittedEmail ? (
          <>
            <CardHeader className="space-y-3 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
              <CardDescription>
                If an unverified account exists for <strong>{submittedEmail}</strong>, we&apos;ve sent a new verification link.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Didn&apos;t receive an email?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your spam folder</li>
                  <li>Your account may already be verified</li>
                  <li>Wait a few minutes for delivery</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmittedEmail(null);
                  form.reset();
                }}
              >
                Try a different email
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Resend verification</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a new verification link.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                            disabled={mutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send Verification Link'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-center text-sm">
              <Button asChild variant="ghost">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}