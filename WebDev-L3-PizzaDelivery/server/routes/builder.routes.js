import { Router } from 'express';
import { validateCustomPizza } from '../controllers/builder.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/validate', requireAuth, validateCustomPizza);

export default router;
