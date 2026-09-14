import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startLowStockCronJob } from './jobs/lowStockCron.job.js';

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
  });

  // Scheduled independently of any HTTP request - runs for as long as the
  // server process does, not only while someone has the inventory page open.
  startLowStockCronJob();
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
