import cron from 'node-cron';
import { env } from '../config/env.js';
import { checkLowStockAndNotify } from '../services/lowStockAlert.service.js';

// Demo-friendly default: every minute, so low-stock automation is easy to
// demonstrate during evaluation without a long wait. For production, set
// LOW_STOCK_CRON_SCHEDULE to something coarser, e.g. '*/15 * * * *' (every
// 15 minutes) or '0 * * * *' (hourly) - the checker itself is idempotent
// either way, so the schedule is purely a demo-vs-production tradeoff.
const DEFAULT_SCHEDULE = '* * * * *';

let task = null;

/**
 * Registers the low-stock checker on a schedule, independent of any user
 * request. Called once from server.js (never from app.js, so importing the
 * app for tests never spins up a background timer against no database).
 * Idempotent - a second call is a no-op, guaranteeing at most one interval.
 */
export function startLowStockCronJob() {
  if (task) return task;

  const configured = env.lowStockCronSchedule;
  const schedule = configured && cron.validate(configured) ? configured : DEFAULT_SCHEDULE;
  if (configured && schedule !== configured) {
    // eslint-disable-next-line no-console
    console.warn(
      `[low-stock] Invalid LOW_STOCK_CRON_SCHEDULE "${configured}" - falling back to "${DEFAULT_SCHEDULE}".`,
    );
  }

  task = cron.schedule(schedule, async () => {
    try {
      await checkLowStockAndNotify();
    } catch (error) {
      // A DB hiccup or unexpected error must never take the server down -
      // log it and let the next scheduled tick retry.
      // eslint-disable-next-line no-console
      console.error('[low-stock] Scheduled check failed:', error.message);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`[low-stock] Cron job scheduled ("${schedule}").`);
  return task;
}

export function stopLowStockCronJob() {
  if (task) {
    task.stop();
    task = null;
  }
}
