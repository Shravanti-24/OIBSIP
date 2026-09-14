import { Router } from 'express';
import { listAdminOrders, getAdminOrderById, updateAdminOrderStatus } from '../controllers/adminOrder.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  adminOrderIdParamValidator,
  adminOrderListValidators,
  adminOrderStatusUpdateValidators,
} from '../middleware/adminOrderValidators.js';

const router = Router();

// Every admin order route is admin-only. Backend authorization is enforced
// here regardless of what the frontend hides or shows.
router.use(requireAuth, requireRole('admin'));

router.get('/', adminOrderListValidators, validate, listAdminOrders);
router.get('/:id', adminOrderIdParamValidator, validate, getAdminOrderById);
router.patch('/:id/status', adminOrderStatusUpdateValidators, validate, updateAdminOrderStatus);

export default router;
