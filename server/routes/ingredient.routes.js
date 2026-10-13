import { Router } from 'express';
import { listIngredients } from '../controllers/ingredient.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listIngredients);

export default router;
