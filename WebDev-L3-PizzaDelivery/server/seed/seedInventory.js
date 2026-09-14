import { connectDB, disconnectDB } from '../config/db.js';
import Ingredient from '../models/Ingredient.js';
import Inventory from '../models/Inventory.js';

/**
 * Idempotent inventory bootstrap. Run with `npm run seed:inventory` after
 * `npm run seed:catalogue` (every inventory record is anchored to an
 * existing ingredient by its stable slug).
 *
 * Upserts by ingredient reference using $setOnInsert, so re-running this
 * script never creates a duplicate inventory record and never resets stock
 * an admin has already changed through the dashboard.
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

async function seedInventory() {
  await connectDB();

  const ingredients = await Ingredient.find({});
  if (ingredients.length === 0) {
    console.warn('[seed:inventory] No ingredients found. Run `npm run seed:catalogue` first.');
    await disconnectDB();
    return;
  }

  let created = 0;
  let alreadyExisted = 0;

  for (const ingredient of ingredients) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Inventory.exists({ ingredient: ingredient._id });
    if (exists) {
      alreadyExisted += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const demo = DEMO_STOCK[ingredient.slug] || DEFAULT_STOCK;
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

  console.log(`[seed:inventory] Created ${created} inventory record(s), ${alreadyExisted} already existed.`);
  await disconnectDB();
}

seedInventory().catch((error) => {
  console.error('[seed:inventory] Failed:', error);
  process.exitCode = 1;
});
