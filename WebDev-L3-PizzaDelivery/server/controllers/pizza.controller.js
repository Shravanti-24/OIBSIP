import Pizza from '../models/Pizza.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const INGREDIENT_FIELDS = 'name category price';

// GET /api/pizzas
export const listPizzas = asyncHandler(async (req, res) => {
  const pizzas = await Pizza.find({ isActive: true })
    .populate('base', INGREDIENT_FIELDS)
    .populate('sauce', INGREDIENT_FIELDS)
    .populate('cheese', INGREDIENT_FIELDS)
    .populate('vegetables', INGREDIENT_FIELDS)
    .sort({ displayOrder: 1, name: 1 });

  res.status(200).json({ success: true, data: { pizzas } });
});
