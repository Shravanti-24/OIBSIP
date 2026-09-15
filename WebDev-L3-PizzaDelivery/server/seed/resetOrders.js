import { connectDB, disconnectDB } from '../config/db.js';
import Order from '../models/Order.js';

/**
 * Local/demo-only utility: deletes every Order document so the app starts
 * from a clean order history (no stale unpaid test orders, no leftover
 * fixture-paid orders from manual QA). Run with `npm run seed:reset:orders`.
 *
 * Scope is deliberately narrow - it only ever touches the Order collection,
 * never Users/Ingredients/Pizzas/Inventory, so it can't take out catalogue
 * or inventory data by accident. It does not touch inventory quantities;
 * pair it with `npm run seed:inventory:reset` to also restore full stock.
 *
 * This does not run automatically and is never called from application
 * code - it is a manual step for resetting a local/demo database only.
 */
async function resetOrders() {
  await connectDB();

  const { deletedCount } = await Order.deleteMany({});
  console.log(`[seed:reset:orders] Deleted ${deletedCount} order(s). Order history is now empty.`);

  await disconnectDB();
}

resetOrders().catch((error) => {
  console.error('[seed:reset:orders] Failed:', error);
  process.exitCode = 1;
});
