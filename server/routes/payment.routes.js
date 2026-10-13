import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { strictAuthLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAuth);
router.post('/create-order', strictAuthLimiter, createPaymentOrder);
router.post('/verify', strictAuthLimiter, verifyPayment);

export default router;
