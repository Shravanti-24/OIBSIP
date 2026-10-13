import Inventory, { STOCK_STATUS, deriveStockStatus } from '../models/Inventory.js';
import { env } from '../config/env.js';
import { sendEmail, lowStockAlertEmailTemplate } from './email.service.js';

/**
 * One detection-and-notify pass over the whole inventory, invoked on a
 * schedule by jobs/lowStockCron.job.js (never by a user request - fulfilling
 * the "runs independently of user requests" requirement).
 *
 * Dedup model: `lowStockAlertSent` on each Inventory doc marks "an alert
 * already went out for the item's *current* below-threshold spell". A run
 * that finds the same still-low item does nothing; a run that finds it back
 * at in-stock clears the flag, so the next dip below threshold is treated as
 * a new event and alerts again (Prompt spec B5/B7).
 *
 * Both low-stock and out-of-stock count as "below threshold" for alerting
 * purposes (out-of-stock is a subset - quantity <= 0 - and always < a
 * positive threshold), but the email clearly labels each row so the two are
 * never presented as the same thing.
 */
export async function checkLowStockAndNotify() {
  if (!env.adminEmail) {
    // eslint-disable-next-line no-console
    console.warn('[low-stock] ADMIN_EMAIL is not configured - skipping low-stock check.');
    return { checked: 0, alerted: 0, skipped: 'no-admin-email' };
  }

  const docs = await Inventory.find({}).populate('ingredient', 'name category');

  const toReset = [];
  const toAlert = [];

  for (const doc of docs) {
    // An Inventory record can only exist for an ingredient that existed at
    // seed time; skip rather than crash the whole run on an orphaned one.
    if (!doc.ingredient) continue;

    const status = deriveStockStatus(doc.quantity, doc.threshold);
    const isBelowThreshold = status !== STOCK_STATUS.IN_STOCK;

    if (isBelowThreshold && !doc.lowStockAlertSent) {
      toAlert.push({
        id: doc._id,
        name: doc.ingredient.name,
        category: doc.ingredient.category,
        quantity: doc.quantity,
        threshold: doc.threshold,
        unit: doc.unit,
        status,
      });
    } else if (!isBelowThreshold && doc.lowStockAlertSent) {
      toReset.push(doc._id);
    }
  }

  if (toReset.length > 0) {
    await Inventory.updateMany(
      { _id: { $in: toReset } },
      { $set: { lowStockAlertSent: false, lowStockAlertSentAt: null } },
    );
  }

  if (toAlert.length === 0) {
    return { checked: docs.length, alerted: 0 };
  }

  const { subject, html } = lowStockAlertEmailTemplate({ items: toAlert });

  try {
    await sendEmail({ to: env.adminEmail, subject, html });
  } catch (error) {
    // Favor eventual delivery: leave lowStockAlertSent untouched so the next
    // scheduled run retries these same items instead of silently dropping
    // the alert.
    // eslint-disable-next-line no-console
    console.error('[low-stock] Failed to send low-stock alert email:', error.message);
    return { checked: docs.length, alerted: 0, emailFailed: true };
  }

  await Inventory.updateMany(
    { _id: { $in: toAlert.map((item) => item.id) } },
    { $set: { lowStockAlertSent: true, lowStockAlertSentAt: new Date() } },
  );

  return { checked: docs.length, alerted: toAlert.length };
}
