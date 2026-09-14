import { Router } from 'express';
import { listInventory, getInventoryItem, updateInventory } from '../controllers/inventory.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { inventoryIdParamValidator, inventoryUpdateValidators } from '../middleware/inventoryValidators.js';

const router = Router();

// Every inventory route is admin-only. Backend authorization is enforced
// here regardless of what the frontend hides or shows.
router.use(requireAuth, requireRole('admin'));

router.get('/', listInventory);
router.get('/:id', inventoryIdParamValidator, validate, getInventoryItem);
router.patch('/:id', inventoryUpdateValidators, validate, updateInventory);

export default router;
