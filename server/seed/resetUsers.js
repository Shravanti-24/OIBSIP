import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Local/demo-only utility: deletes every non-admin User document (and, since
 * an Order without its owning user would otherwise be an orphaned record,
 * every Order placed by one of those deleted accounts) so a clean demo
 * starts with zero personal/test user accounts. Run with
 * `npm run seed:reset:users`.
 *
 * Scope is deliberately narrow - it never touches an account with
 * role: 'admin', and never touches Ingredients/Pizzas/Inventory. It does not
 * delete every order (only orders belonging to deleted users); pair it with
 * `npm run seed:reset:orders` for a fully empty order history.
 *
 * This does not run automatically and is never called from application
 * code - it is a manual step for resetting a local/demo database only.
 */
async function resetUsers() {
  await connectDB();

  const usersToDelete = await User.find({ role: { $ne: 'admin' } }).select('_id');
  const userIds = usersToDelete.map((user) => user._id);

  if (userIds.length === 0) {
    console.log('[seed:reset:users] No non-admin user accounts found. Nothing to delete.');
    await disconnectDB();
    return;
  }

  const { deletedCount: deletedOrders } = await Order.deleteMany({ user: { $in: userIds } });
  const { deletedCount: deletedUsers } = await User.deleteMany({ _id: { $in: userIds } });

  console.log(
    `[seed:reset:users] Deleted ${deletedUsers} non-admin user account(s) and ${deletedOrders} order(s) belonging to them.`,
  );

  await disconnectDB();
}

resetUsers().catch((error) => {
  console.error('[seed:reset:users] Failed:', error);
  process.exitCode = 1;
});
