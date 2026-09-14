import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter, strictAuthLimiter } from '../middleware/rateLimit.js';
import {
  registerValidators,
  loginValidators,
  emailOnlyValidators,
  verifyEmailValidators,
  resetPasswordValidators,
} from '../middleware/authValidators.js';

const router = Router();

router.post('/register', authLimiter, registerValidators, validate, register);
router.get('/verify-email', authLimiter, verifyEmailValidators, validate, verifyEmail);
router.post('/resend-verification', authLimiter, emailOnlyValidators, validate, resendVerification);
router.post('/login', strictAuthLimiter, loginValidators, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', strictAuthLimiter, emailOnlyValidators, validate, forgotPassword);
router.post('/reset-password', strictAuthLimiter, resetPasswordValidators, validate, resetPassword);
router.get('/me', requireAuth, me);

export default router;
