import { verifyAuthToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

function extractToken(req) {
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expired, please log in again'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }

  req.user = { id: payload.sub, role: payload.role };
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}
