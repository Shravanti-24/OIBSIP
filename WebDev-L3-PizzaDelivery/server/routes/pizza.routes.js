import { Router } from 'express';
import { listPizzas } from '../controllers/pizza.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listPizzas);

export default router;
