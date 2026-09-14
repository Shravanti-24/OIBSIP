import { resolveCustomPizzaSelection } from '../services/pricing.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/builder/validate
// Validates a custom pizza selection sent by the client and returns the
// authoritative, database-derived ingredients and price. This does not
// create an order - it only confirms the selection is valid and priceable.
export const validateCustomPizza = asyncHandler(async (req, res) => {
  const { baseId, sauceId, cheeseId, vegetableIds } = req.body;

  const selection = await resolveCustomPizzaSelection({ baseId, sauceId, cheeseId, vegetableIds });

  res.status(200).json({
    success: true,
    message: 'Your pizza selection is valid',
    data: { selection },
  });
});
