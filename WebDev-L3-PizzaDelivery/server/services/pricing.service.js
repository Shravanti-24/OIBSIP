import mongoose from 'mongoose';
import Ingredient from '../models/Ingredient.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';

function publicIngredient(ingredient) {
  return {
    id: ingredient._id,
    name: ingredient.name,
    category: ingredient.category,
    price: ingredient.price,
  };
}

/**
 * Authoritative validation + pricing for a custom pizza selection.
 *
 * Never trusts ingredient names or prices supplied by the client - every
 * price comes from the current database record, and every ID is checked
 * for existence, category and availability before it is used. This is the
 * single source of truth reused by the builder endpoint now, and intended
 * for reuse by the future order-creation endpoint.
 */
export async function resolveCustomPizzaSelection({ baseId, sauceId, cheeseId, vegetableIds }) {
  const fieldErrors = [];
  const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
  const safeVegetableIds = Array.isArray(vegetableIds) ? vegetableIds : [];

  if (!isValidId(baseId)) fieldErrors.push({ field: 'baseId', message: 'A valid base selection is required' });
  if (!isValidId(sauceId)) fieldErrors.push({ field: 'sauceId', message: 'A valid sauce selection is required' });
  if (!isValidId(cheeseId)) fieldErrors.push({ field: 'cheeseId', message: 'A valid cheese selection is required' });
  if (!Array.isArray(vegetableIds) && vegetableIds !== undefined) {
    fieldErrors.push({ field: 'vegetableIds', message: 'vegetableIds must be an array' });
  } else if (safeVegetableIds.some((id) => !isValidId(id))) {
    fieldErrors.push({ field: 'vegetableIds', message: 'One or more vegetable IDs are invalid' });
  }

  if (fieldErrors.length) {
    throw ApiError.badRequest('Invalid pizza selection', fieldErrors);
  }

  const uniqueIds = [...new Set([baseId, sauceId, cheeseId, ...safeVegetableIds].map(String))];
  const docs = await Ingredient.find({ _id: { $in: uniqueIds } });
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  function requireIngredient(id, category, field) {
    const doc = byId.get(String(id));
    if (!doc) {
      fieldErrors.push({ field, message: `Selected ${category} does not exist` });
      return null;
    }
    if (doc.category !== category) {
      fieldErrors.push({ field, message: `Selected ${category} is not a valid ${category}` });
      return null;
    }
    if (!doc.isActive) {
      fieldErrors.push({ field, message: `Selected ${category} is currently unavailable` });
      return null;
    }
    return doc;
  }

  const base = requireIngredient(baseId, 'base', 'baseId');
  const sauce = requireIngredient(sauceId, 'sauce', 'sauceId');
  const cheese = requireIngredient(cheeseId, 'cheese', 'cheeseId');
  const vegetables = safeVegetableIds.map((id) => requireIngredient(id, 'vegetable', 'vegetableIds')).filter(Boolean);

  if (fieldErrors.length) {
    throw ApiError.badRequest('Invalid pizza selection', fieldErrors);
  }

  const price = round2(
    base.price + sauce.price + cheese.price + vegetables.reduce((sum, veg) => sum + veg.price, 0),
  );

  return {
    base: publicIngredient(base),
    sauce: publicIngredient(sauce),
    cheese: publicIngredient(cheese),
    vegetables: vegetables.map(publicIngredient),
    price,
  };
}
