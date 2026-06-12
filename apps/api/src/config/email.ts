import { env } from './env';

/**
 * Email Service.
 *
 * Centralized email sending. Currently logs to console for development.
 *
 * TO ENABLE REAL EMAILS (production):
 *   1. npm install resend
 *   2. Add RESEND_API_KEY to .env
 *   3. Replace `logEmailToConsole` with Resend's sendEmail
 *   4. No other code changes needed
 *
 * This abstraction means our auth service never needs to know
 * HOW emails are sent — just that they ARE sent.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email.
 *
 * Currently logs to console.
 * Swap to Resend (or any provider) when ready for production.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (env.NODE_ENV === 'production') {
    // TODO: Wire up Resend here when going live
    console.warn('[EMAIL] Production email sending not configured');
    return;
  }

  logEmailToConsole(payload);
}

/**
 * Pretty-print emails to the terminal in development.
 *
 * Shows a clearly formatted block so developers can easily
 * see what would have been sent.
 */
function logEmailToConsole(payload: EmailPayload): void {
  const line = '─'.repeat(70);

  console.info(`\n${line}`);
  console.info('📧  EMAIL (DEV — NOT ACTUALLY SENT)');
  console.info(line);
  console.info(`TO:       ${payload.to}`);
  console.info(`SUBJECT:  ${payload.subject}`);
  console.info(line);
  console.info('TEXT BODY:');
  console.info(payload.text ?? stripHtml(payload.html));
  console.info(`${line}\n`);
}

/**
 * Crude HTML → text conversion for console display.
 * Strips tags and decodes common entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Email Templates.
 *
 * Each function returns a complete EmailPayload ready to send.
 * Keeping these here means consistent branding and easy updates.
 */

export function buildVerificationEmail(
  to: string,
  firstName: string,
  verificationUrl: string
): EmailPayload {
  return {
    to,
    subject: 'Verify your LuxeCart email',
    html: `
      <h1>Welcome to LuxeCart, ${firstName}!</h1>
      <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email Address</a></p>
      <p>Or copy and paste this URL:</p>
      <p>${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    text: `Welcome to LuxeCart, ${firstName}!

Thanks for signing up. Please verify your email address by visiting this link:

${verificationUrl}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.`,
  };
}

export function buildPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): EmailPayload {
  return {
    to,
    subject: 'Reset your LuxeCart password',
    html: `
      <h1>Reset your password</h1>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset the password for your LuxeCart account.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>Or copy and paste this URL:</p>
      <p>${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    `,
    text: `Reset your password

Hi ${firstName},

We received a request to reset the password for your LuxeCart account.

Reset link: ${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email — your password won't change.`,
  };
}