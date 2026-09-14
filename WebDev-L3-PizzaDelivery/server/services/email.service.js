import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

/**
 * Sends a transactional email via Resend.
 * If no API key is configured (e.g. local development without credentials),
 * the email is logged instead of sent so the flow can still be exercised end-to-end.
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] RESEND_API_KEY is not configured. Skipping real delivery.\n` +
        `[email] Would have sent "${subject}" to ${to}:\n${html}`,
    );
    return { skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error.message);
    throw error;
  }
}

export function verificationEmailTemplate({ name, verifyUrl }) {
  return {
    subject: 'Verify your email - Pizza Delivery',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(name)},</h2>
        <p>Thanks for signing up for Pizza Delivery. Please verify your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#e0442b;color:#fff;text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
        </p>
        <p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  };
}

export function passwordResetEmailTemplate({ name, resetUrl }) {
  return {
    subject: 'Reset your password - Pizza Delivery',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(name)},</h2>
        <p>We received a request to reset your Pizza Delivery password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#e0442b;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
