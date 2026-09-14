import User from '../models/User.js';
import { comparePassword } from '../services/password.service.js';
import { signAuthToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

// POST /api/admin/login
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Identical error for "no such user", "wrong password" and "not an admin"
  // so this endpoint cannot be used to discover which accounts are admins.
  if (!user || user.role !== 'admin') {
    throw ApiError.unauthorized('Invalid admin credentials');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid admin credentials');
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Admin logged in successfully',
    data: { user: publicUser(user), token },
  });
});

// POST /api/admin/logout
export const adminLogout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/me
export const adminMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized as admin');
  }
  res.status(200).json({ success: true, data: { user: publicUser(user) } });
});
