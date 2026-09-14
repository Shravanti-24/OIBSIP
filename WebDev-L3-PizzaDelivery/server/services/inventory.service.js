import Inventory, { STOCK_STATUS, deriveStockStatus } from '../models/Inventory.js';
import { INGREDIENT_CATEGORIES } from '../models/Ingredient.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_QUANTITY = 100000;
const MAX_THRESHOLD = 100000;

export class InsufficientStockError extends ApiError {
  constructor(shortages) {
    super(409, 'Some ingredients in this order are currently out of stock and it cannot be fulfilled.');
    this.name = 'InsufficientStockError';
    this.shortages = shortages;
  }
}

function serializeInventoryDoc(doc) {
  const ingredient = doc.ingredient;
  return {
    id: doc._id.toString(),
    ingredientId: (ingredient?._id ?? doc.ingredient).toString(),
    ingredientName: ingredient?.name ?? null,
    category: ingredient?.category ?? null,
    quantity: doc.quantity,
    threshold: doc.threshold,
    unit: doc.unit,
    isActive: doc.isActive,
    status: deriveStockStatus(doc.quantity, doc.threshold),
    version: doc.__v,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

/**
 * Admin dashboard read model: every inventory record joined to its
 * ingredient's name/category, with canonical stock status and summary
 * counts. Category/status filters are applied in-memory after the join
 * since the category actually lives on Ingredient, not Inventory.
 */
export async function listInventory({ category, status } = {}) {
  if (category !== undefined && !INGREDIENT_CATEGORIES.includes(category)) {
    throw ApiError.badRequest(`Invalid category. Must be one of: ${INGREDIENT_CATEGORIES.join(', ')}`);
  }
  if (status !== undefined && !Object.values(STOCK_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid status. Must be one of: ${Object.values(STOCK_STATUS).join(', ')}`);
  }

  const docs = await Inventory.find({}).populate('ingredient', 'name category price isActive');

  // An Inventory record can only ever exist for an ingredient that existed
  // at seed time; a null-populate here would mean the ingredient was
  // deleted out from under it. Skip rather than surface an orphan.
  let items = docs.filter((doc) => doc.ingredient).map(serializeInventoryDoc);

  const summary = {
    total: items.length,
    lowStock: items.filter((item) => item.status === STOCK_STATUS.LOW_STOCK).length,
    outOfStock: items.filter((item) => item.status === STOCK_STATUS.OUT_OF_STOCK).length,
  };

  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);

  items.sort((a, b) => {
    const categoryDiff = INGREDIENT_CATEGORIES.indexOf(a.category) - INGREDIENT_CATEGORIES.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return (a.ingredientName || '').localeCompare(b.ingredientName || '');
  });

  return { items, summary };
}

export async function getInventoryById(id) {
  const doc = await Inventory.findById(id).populate('ingredient', 'name category price isActive');
  if (!doc || !doc.ingredient) return null;
  return serializeInventoryDoc(doc);
}

function isValidWholeNumber(value, max) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

/**
 * Admin manual stock update. Semantics are "set to this absolute value",
 * never "add/subtract" - unambiguous for a demo and for the admin reading
 * their own input back. Uses Mongoose's version key as an optimistic lock:
 * when the caller supplies the version it last read, a concurrent change
 * (another admin, or an order consuming stock) since that read is detected
 * and rejected as a conflict instead of being silently overwritten.
 */
export async function updateInventory(id, { quantity, threshold, version }) {
  if (quantity === undefined && threshold === undefined) {
    throw ApiError.badRequest('Provide quantity and/or threshold to update');
  }
  if (quantity !== undefined && !isValidWholeNumber(quantity, MAX_QUANTITY)) {
    throw ApiError.badRequest('Invalid quantity', [
      { field: 'quantity', message: `Quantity must be a whole number between 0 and ${MAX_QUANTITY}` },
    ]);
  }
  if (threshold !== undefined && !isValidWholeNumber(threshold, MAX_THRESHOLD)) {
    throw ApiError.badRequest('Invalid threshold', [
      { field: 'threshold', message: `Threshold must be a whole number between 0 and ${MAX_THRESHOLD}` },
    ]);
  }

  const filter = { _id: id };
  if (version !== undefined) {
    filter.__v = version;
  }

  const update = { $set: {}, $inc: { __v: 1 } };
  if (quantity !== undefined) update.$set.quantity = quantity;
  if (threshold !== undefined) update.$set.threshold = threshold;

  const doc = await Inventory.findOneAndUpdate(filter, update, {
    returnDocument: 'after',
    runValidators: true,
  }).populate(
    'ingredient',
    'name category price isActive',
  );

  if (!doc) {
    const exists = await Inventory.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Inventory item not found');
    throw ApiError.conflict('This item was changed elsewhere. Please refresh and try again.');
  }

  return serializeInventoryDoc(doc);
}

/**
 * Sums how many units of each ingredient an order requires, across every
 * item and its quantity. Ready-made and custom items share the same
 * frozen ingredient-snapshot shape on Order, so both are handled uniformly
 * here without branching on item.type.
 */
function aggregateRequiredQuantities(order) {
  const required = new Map();

  function add(ingredientId, qty) {
    if (!ingredientId) return;
    const key = ingredientId.toString();
    required.set(key, (required.get(key) || 0) + qty);
  }

  for (const item of order.items) {
    const qty = item.quantity;
    add(item.base?.id, qty);
    add(item.sauce?.id, qty);
    add(item.cheese?.id, qty);
    for (const vegetable of item.vegetables || []) {
      add(vegetable?.id, qty);
    }
  }

  return required;
}

async function rollbackDeductions(applied) {
  await Promise.all(
    applied.map(({ ingredientId, qty }) =>
      Inventory.updateOne({ ingredient: ingredientId }, { $inc: { quantity: qty, __v: 1 } }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[inventory] Failed to roll back ingredient ${ingredientId} by ${qty}:`, error.message);
      }),
    ),
  );
}

/**
 * Deducts stock for a verified, paid order. Must only ever be called after
 * payment has been verified - never at order creation, checkout, or a
 * failed/cancelled payment.
 *
 * Idempotent: if `order.inventoryDeducted` is already true this is a no-op,
 * so a duplicate payment-verification call cannot double-deduct.
 *
 * Concurrency: this deployment runs MongoDB as a standalone instance (no
 * replica set), so multi-document ACID transactions aren't available.
 * Instead, each ingredient is decremented with a single atomic, conditional
 * update ($inc guarded by quantity >= required) - MongoDB guarantees that
 * single-document write is atomic, so two concurrent orders competing for
 * the same ingredient can never drive it negative. If an order needs
 * several ingredients and a later one in the loop loses that race, the
 * ingredients already decremented for this order are rolled back so the
 * order fails cleanly rather than partially consuming stock.
 */
export async function consumeForOrder(order) {
  if (order.inventoryDeducted) {
    return { alreadyProcessed: true, deducted: [] };
  }

  const required = aggregateRequiredQuantities(order);
  if (required.size === 0) {
    return { alreadyProcessed: false, deducted: [] };
  }

  const ingredientIds = [...required.keys()];
  const inventories = await Inventory.find({ ingredient: { $in: ingredientIds } });
  const byIngredientId = new Map(inventories.map((inv) => [inv.ingredient.toString(), inv]));

  const shortages = [];
  for (const [ingredientId, qty] of required.entries()) {
    const inventory = byIngredientId.get(ingredientId);
    if (!inventory || inventory.quantity < qty) {
      shortages.push({ ingredientId, required: qty, available: inventory?.quantity ?? 0 });
    }
  }
  if (shortages.length > 0) {
    throw new InsufficientStockError(shortages);
  }

  const applied = [];
  try {
    for (const [ingredientId, qty] of required.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Inventory.findOneAndUpdate(
        { ingredient: ingredientId, quantity: { $gte: qty } },
        { $inc: { quantity: -qty, __v: 1 } },
        { returnDocument: 'after' },
      );
      if (!updated) {
        throw new InsufficientStockError([
          { ingredientId, required: qty, available: byIngredientId.get(ingredientId)?.quantity ?? 0 },
        ]);
      }
      applied.push({ ingredientId, qty });
    }
  } catch (error) {
    await rollbackDeductions(applied);
    throw error;
  }

  return { alreadyProcessed: false, deducted: applied };
}
