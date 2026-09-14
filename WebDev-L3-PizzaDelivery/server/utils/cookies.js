import { isProduction } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

export function setAuthCookie(res, token) {
  res.cookie('token', token, authCookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie('token', { ...authCookieOptions(), maxAge: undefined });
}
