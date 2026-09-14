import { Router } from 'express';
import { createOrder, listOrders, getOrderById } from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrderById);

export default router;
