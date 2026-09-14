import User from '../models/User.js';
import { hashPassword, comparePassword } from '../services/password.service.js';
import {
  issueEmailVerificationToken,
  consumeEmailVerificationToken,
  issuePasswordResetToken,
  findUserByResetToken,
  invalidatePasswordResetToken,
} from '../services/token.service.js';
import { sendEmail, verificationEmailTemplate, passwordResetEmailTemplate } from '../services/email.service.js';
import { signAuthToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

async function dispatchVerificationEmail(user) {
  const rawToken = await issueEmailVerificationToken(user);
  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  const { subject, html } = verificationEmailTemplate({ name: user.name, verifyUrl });
  try {
    await sendEmail({ to: user.email, subject, html });
  } catch {
    // Delivery failures should not block registration; the user can request a resend.
  }
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  // Only name/email/password are ever read - a client cannot self-assign a role.
  const { name, email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'user',
    isVerified: false,
  });

  await dispatchVerificationEmail(user);

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your account.',
    data: { user: publicUser(user) },
  });
});

// GET /api/auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Verification token is required');
  }

  const user = await consumeEmailVerificationToken(token);
  if (!user) {
    throw ApiError.badRequest('This verification link is invalid or has expired');
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

// POST /api/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && !user.isVerified) {
    await dispatchVerificationEmail(user);
  }

  // Same response whether or not the account exists/is already verified,
  // so this endpoint cannot be used to enumerate registered emails.
  res.status(200).json({
    success: true,
    message: 'If an unverified account exists for that email, a new verification link has been sent.',
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: publicUser(user), token },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const rawToken = await issuePasswordResetToken(user);
    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    const { subject, html } = passwordResetEmailTemplate({ name: user.name, resetUrl });
    try {
      await sendEmail({ to: user.email, subject, html });
    } catch {
      // Swallow delivery errors - response must stay identical either way.
    }
  }

  // Identical response regardless of whether the account exists, to prevent enumeration.
  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await findUserByResetToken(token);
  if (!user) {
    throw ApiError.badRequest('This password reset link is invalid or has expired');
  }

  user.passwordHash = await hashPassword(password);
  await invalidatePasswordResetToken(user);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists');
  }
  res.status(200).json({ success: true, data: { user: publicUser(user) } });
});
