import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { hashPassword } from '../services/password.service.js';

/**
 * Idempotent admin bootstrap. Run with `npm run seed:admin`.
 * Reads credentials from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD env vars
 * so no admin account (or its password) is ever hardcoded or committed.
 */
async function seedAdmin() {
  if (!env.adminEmail || !env.adminPassword || !env.adminName) {
    console.error(
      '[seed:admin] ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment. Aborting.',
    );
    process.exitCode = 1;
    return;
  }

  await connectDB();

  const normalizedEmail = env.adminEmail.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isVerified = true;
      await existing.save();
      console.log(`[seed:admin] Promoted existing account ${normalizedEmail} to admin.`);
    } else {
      console.log(`[seed:admin] Admin ${normalizedEmail} already exists. No changes made.`);
    }
    await disconnectDB();
    return;
  }

  const passwordHash = await hashPassword(env.adminPassword);
  await User.create({
    name: env.adminName,
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
    isVerified: true,
  });

  console.log(`[seed:admin] Admin account created for ${normalizedEmail}.`);
  await disconnectDB();
}

seedAdmin().catch((error) => {
  console.error('[seed:admin] Failed:', error);
  process.exitCode = 1;
});
