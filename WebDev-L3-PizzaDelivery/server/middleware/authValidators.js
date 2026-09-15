import { body, query } from 'express-validator';

export const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

export const loginValidators = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const emailOnlyValidators = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
];

// Registration normalizes email with .normalizeEmail() (e.g. Gmail dots/+subaddress
// stripping), so the stored, canonical address may differ from what a user later
// types by hand. Forgot-password must normalize the same way before looking the
// account up, or a legitimately registered user's own email can silently fail to
// match - which looks identical to "no account exists" and no email ever sends.
export const forgotPasswordValidators = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const verifyEmailValidators = [
  query('token').notEmpty().withMessage('Verification token is required'),
];

export const resetPasswordValidators = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];
