import cron from 'node-cron';
import { env } from '../config/env.js';
import { checkLowStockAndNotify } from '../services/lowStockAlert.service.js';

// Every 15 minutes. The checker is idempotent and only emails on a *newly*
// breached threshold, so the schedule is purely a latency-vs-noise tradeoff:
// set LOW_STOCK_CRON_SCHEDULE to '* * * * *' to watch it work in a demo, or
// '0 * * * *' to check hourly.
const DEFAULT_SCHEDULE = '*/15 * * * *';

let task = null;
let isRunning = false;

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
    console.warn(
      `[low-stock] Invalid LOW_STOCK_CRON_SCHEDULE "${configured}" - falling back to "${DEFAULT_SCHEDULE}".`,
    );
  }

  task = cron.schedule(schedule, async () => {
    // In-process reentrancy guard: if a previous run is still in flight
    // (e.g. a slow DB or a slow email provider) when the next tick fires,
    // skip this tick rather than running two checks concurrently. The next
    // scheduled tick after this one will simply pick up wherever stock
    // stands then - nothing is lost, since the checker always evaluates
    // current state rather than a delta.
    if (isRunning) {
      console.warn('[low-stock] Previous check still running - skipping this tick.');
      return;
    }

    isRunning = true;
    try {
      await checkLowStockAndNotify();
    } catch (error) {
      // A DB hiccup or unexpected error must never take the server down -
      // log it and let the next scheduled tick retry.
      console.error('[low-stock] Scheduled check failed:', error.message);
    } finally {
      isRunning = false;
    }
  });

  console.log(`[low-stock] Cron job scheduled ("${schedule}").`);
  return task;
}

export function stopLowStockCronJob() {
  if (task) {
    task.stop();
    task = null;
  }
  isRunning = false;
}
