import mongoose from 'mongoose';
import Pizza from '../models/Pizza.js';
import { resolveCustomPizzaSelection } from './pricing.service.js';
import { round2 } from '../utils/money.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_QUANTITY = 20;
const MAX_ITEMS_PER_ORDER = 20;

function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY;
}

function snapshotIngredient(ingredient) {
  return { id: ingredient._id, name: ingredient.name, price: ingredient.price };
}

async function resolveReadyMadeItem({ pizzaId, quantity }) {
  if (typeof pizzaId !== 'string' || !mongoose.Types.ObjectId.isValid(pizzaId)) {
    throw ApiError.badRequest('Invalid pizza selection', [
      { field: 'pizzaId', message: 'A valid pizza is required' },
    ]);
  }

  const pizza = await Pizza.findById(pizzaId).populate('base sauce cheese vegetables', 'name category price');
  if (!pizza || !pizza.isActive) {
    throw ApiError.badRequest('Invalid pizza selection', [
      { field: 'pizzaId', message: 'Selected pizza is currently unavailable' },
    ]);
  }

  const unitPrice = pizza.price;
  return {
    type: 'ready-made',
    name: pizza.name,
    pizza: pizza._id,
    base: pizza.base ? snapshotIngredient(pizza.base) : undefined,
    sauce: pizza.sauce ? snapshotIngredient(pizza.sauce) : undefined,
    cheese: pizza.cheese ? snapshotIngredient(pizza.cheese) : undefined,
    vegetables: (pizza.vegetables || []).map(snapshotIngredient),
    quantity,
    unitPrice,
    itemTotal: round2(unitPrice * quantity),
  };
}

async function resolveCustomItem({ baseId, sauceId, cheeseId, vegetableIds, quantity }) {
  const { base, sauce, cheese, vegetables, price } = await resolveCustomPizzaSelection({
    baseId,
    sauceId,
    cheeseId,
    vegetableIds,
  });

  return {
    type: 'custom',
    name: 'Custom Pizza',
    base: { id: base.id, name: base.name, price: base.price },
    sauce: { id: sauce.id, name: sauce.name, price: sauce.price },
    cheese: { id: cheese.id, name: cheese.name, price: cheese.price },
    vegetables: vegetables.map((veg) => ({ id: veg.id, name: veg.name, price: veg.price })),
    quantity,
    unitPrice: price,
    itemTotal: round2(price * quantity),
  };
}

/**
 * Authoritative validation + pricing for an entire order's line items.
 * Never trusts client-supplied prices or totals - every rupee figure here
 * is derived from the current database record for the referenced pizza or
 * ingredients. This is the single source of truth for order creation.
 */
export async function resolveOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw ApiError.badRequest('An order must contain at least one item');
  }
  if (rawItems.length > MAX_ITEMS_PER_ORDER) {
    throw ApiError.badRequest(`An order cannot contain more than ${MAX_ITEMS_PER_ORDER} items`);
  }

  const items = [];
  for (const raw of rawItems) {
    const quantity = raw?.quantity ?? 1;
    if (!isValidQuantity(quantity)) {
      throw ApiError.badRequest('Invalid quantity', [
        { field: 'quantity', message: `Quantity must be a whole number between 1 and ${MAX_QUANTITY}` },
      ]);
    }

    if (raw?.type === 'ready-made') {
      items.push(await resolveReadyMadeItem({ pizzaId: raw.pizzaId, quantity }));
    } else if (raw?.type === 'custom') {
      items.push(
        await resolveCustomItem({
          baseId: raw.baseId,
          sauceId: raw.sauceId,
          cheeseId: raw.cheeseId,
          vegetableIds: raw.vegetableIds,
          quantity,
        }),
      );
    } else {
      throw ApiError.badRequest('Invalid item type', [
        { field: 'type', message: 'type must be "ready-made" or "custom"' },
      ]);
    }
  }

  const totalAmount = round2(items.reduce((sum, item) => sum + item.itemTotal, 0));
  return { items, totalAmount };
}
