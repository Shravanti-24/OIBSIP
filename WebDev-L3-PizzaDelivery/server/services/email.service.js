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
    subject: 'Verify your email - Pizza House',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(name)},</h2>
        <p>Thanks for signing up for Pizza House. Please verify your email address to activate your account.</p>
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
    subject: 'Reset your password - Pizza House',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(name)},</h2>
        <p>We received a request to reset your Pizza House password.</p>
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

/**
 * items: [{ name, category, quantity, threshold, unit, status }], status is
 * one of the Inventory STOCK_STATUS values ('low-stock' | 'out-of-stock').
 * Kept as one consolidated email per alert run rather than one per item.
 */
export function lowStockAlertEmailTemplate({ items }) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize;">${escapeHtml(item.category)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.quantity)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.threshold)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.unit)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;color:${
            item.status === 'out-of-stock' ? '#b91c1c' : '#b45309'
          };">${item.status === 'out-of-stock' ? 'OUT OF STOCK' : 'LOW STOCK'}</td>
        </tr>`,
    )
    .join('');

  return {
    subject: 'Pizza House — Low Stock Alert',
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Pizza House Inventory Alert</h2>
        <p>The following inventory items are below their configured stock thresholds:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="text-align:left;background:#f9f9f9;">
              <th style="padding:8px;">Ingredient</th>
              <th style="padding:8px;">Category</th>
              <th style="padding:8px;">Current Stock</th>
              <th style="padding:8px;">Threshold</th>
              <th style="padding:8px;">Unit</th>
              <th style="padding:8px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;">Please update inventory from the admin dashboard.</p>
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
