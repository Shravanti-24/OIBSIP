import { Router } from 'express';
import { adminLogin, adminLogout, adminMe } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { strictAuthLimiter } from '../middleware/rateLimit.js';
import { loginValidators } from '../middleware/authValidators.js';

const router = Router();

router.post('/login', strictAuthLimiter, loginValidators, validate, adminLogin);
router.post('/logout', adminLogout);
router.get('/me', requireAuth, requireRole('admin'), adminMe);

export default router;
