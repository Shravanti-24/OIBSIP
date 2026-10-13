import api from './api';

export function register({ name, email, password, confirmPassword }) {
  return api.post('/auth/register', { name, email, password, confirmPassword });
}

export function verifyEmail(token) {
  return api.get('/auth/verify-email', { params: { token } });
}

export function resendVerification(email) {
  return api.post('/auth/resend-verification', { email });
}

export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email });
}

export function resetPassword({ token, password, confirmPassword }) {
  return api.post('/auth/reset-password', { token, password, confirmPassword });
}

export function fetchCurrentUser() {
  return api.get('/auth/me');
}

export function adminLogin({ email, password }) {
  return api.post('/admin/login', { email, password });
}

export function adminLogout() {
  return api.post('/admin/logout');
}
