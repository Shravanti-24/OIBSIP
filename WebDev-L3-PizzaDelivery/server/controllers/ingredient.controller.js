import Ingredient, { INGREDIENT_CATEGORIES } from '../models/Ingredient.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/ingredients?category=base|sauce|cheese|vegetable
export const listIngredients = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };

  if (category !== undefined) {
    if (!INGREDIENT_CATEGORIES.includes(category)) {
      throw ApiError.badRequest(
        `Invalid category. Must be one of: ${INGREDIENT_CATEGORIES.join(', ')}`,
      );
    }
    filter.category = category;
  }

  const ingredients = await Ingredient.find(filter).sort({ category: 1, displayOrder: 1, name: 1 });

  res.status(200).json({ success: true, data: { ingredients } });
});
