import { connectDB, disconnectDB } from '../config/db.js';
import Ingredient from '../models/Ingredient.js';
import Inventory from '../models/Inventory.js';

/**
 * Idempotent inventory bootstrap. Run with `npm run seed:inventory` after
 * `npm run seed:catalogue` (every inventory record is anchored to an
 * existing ingredient by its stable slug).
 *
 * Default mode only creates missing records, so re-running this script
 * never creates a duplicate inventory record and never resets stock an
 * admin has already changed through the dashboard.
 *
 * Pass `--reset` (or run `npm run seed:inventory:reset`) to additionally
 * restore every existing record's quantity/threshold to its DEMO_STOCK
 * value and clear any low-stock alert flag - intended for local/demo use
 * only (e.g. before a presentation), never for production, since it
 * overwrites real admin-entered stock levels.
 */

const DEMO_STOCK = {
  'classic-crust': { quantity: 50, threshold: 10 },
  'thin-crust': { quantity: 45, threshold: 10 },
  'cheese-burst': { quantity: 30, threshold: 8 },
  'whole-wheat': { quantity: 40, threshold: 10 },
  'pan-crust': { quantity: 35, threshold: 10 },

  'classic-tomato': { quantity: 60, threshold: 12 },
  'spicy-arrabbiata': { quantity: 40, threshold: 10 },
  'garlic-herb': { quantity: 35, threshold: 10 },
  pesto: { quantity: 30, threshold: 8 },
  bbq: { quantity: 35, threshold: 10 },

  mozzarella: { quantity: 50, threshold: 12 },
  cheddar: { quantity: 35, threshold: 10 },
  parmesan: { quantity: 30, threshold: 8 },

  onion: { quantity: 60, threshold: 15 },
  capsicum: { quantity: 50, threshold: 15 },
  tomato: { quantity: 55, threshold: 15 },
  jalapeno: { quantity: 30, threshold: 10 },
  mushroom: { quantity: 45, threshold: 12 },
  'sweet-corn': { quantity: 50, threshold: 12 },
};

const DEFAULT_STOCK = { quantity: 30, threshold: 10 };
const UNIT = 'portion';

async function seedInventory({ reset = false } = {}) {
  await connectDB();

  const ingredients = await Ingredient.find({});
  if (ingredients.length === 0) {
    console.warn('[seed:inventory] No ingredients found. Run `npm run seed:catalogue` first.');
    await disconnectDB();
    return;
  }

  let created = 0;
  let alreadyExisted = 0;
  let reset_ = 0;

  for (const ingredient of ingredients) {
    const demo = DEMO_STOCK[ingredient.slug] || DEFAULT_STOCK;
    // eslint-disable-next-line no-await-in-loop
    const existing = await Inventory.findOne({ ingredient: ingredient._id });

    if (existing) {
      alreadyExisted += 1;
      if (reset) {
        existing.quantity = demo.quantity;
        existing.threshold = demo.threshold;
        existing.isActive = true;
        existing.lowStockAlertSent = false;
        existing.lowStockAlertSentAt = null;
        // eslint-disable-next-line no-await-in-loop
        await existing.save();
        reset_ += 1;
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      await Inventory.create({
        ingredient: ingredient._id,
        quantity: demo.quantity,
        threshold: demo.threshold,
        unit: UNIT,
        isActive: true,
      });
      created += 1;
    } catch (error) {
      // Unique index guards against a duplicate slipping in between the
      // exists() check and this create() - treat that race as "already
      // existed" rather than a failure.
      if (error.code === 11000) {
        alreadyExisted += 1;
      } else {
        throw error;
      }
    }
  }

  console.log(
    `[seed:inventory] Created ${created} inventory record(s), ${alreadyExisted} already existed` +
      (reset ? `, ${reset_} reset to full demo stock.` : '.'),
  );
  await disconnectDB();
}

const reset = process.argv.includes('--reset');

seedInventory({ reset }).catch((error) => {
  console.error('[seed:inventory] Failed:', error);
  process.exitCode = 1;
});
