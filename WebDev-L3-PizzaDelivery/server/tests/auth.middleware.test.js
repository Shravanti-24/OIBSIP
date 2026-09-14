import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

function makeReq({ cookieToken, headerToken } = {}) {
  return {
    cookies: cookieToken ? { token: cookieToken } : {},
    headers: headerToken ? { authorization: `Bearer ${headerToken}` } : {},
  };
}

const validToken = jwt.sign({ sub: 'user-1', role: 'user' }, env.jwtSecret, { expiresIn: '1h' });
const adminToken = jwt.sign({ sub: 'admin-1', role: 'admin' }, env.jwtSecret, { expiresIn: '1h' });
const expiredToken = jwt.sign({ sub: 'user-1', role: 'user' }, env.jwtSecret, { expiresIn: -10 });

describe('requireAuth', () => {
  it('rejects a request with no token', () => {
    const next = vi.fn();
    requireAuth(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects an invalid token', () => {
    const next = vi.fn();
    requireAuth(makeReq({ cookieToken: 'garbage' }), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects an expired token', () => {
    const next = vi.fn();
    requireAuth(makeReq({ cookieToken: expiredToken }), {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/expired/i);
  });

  it('accepts a valid cookie token and attaches req.user', () => {
    const req = makeReq({ cookieToken: validToken });
    const next = vi.fn();
    requireAuth(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-1', role: 'user' });
  });

  it('accepts a valid Authorization bearer token', () => {
    const req = makeReq({ headerToken: validToken });
    const next = vi.fn();
    requireAuth(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-1', role: 'user' });
  });
});

describe('requireRole', () => {
  it('rejects an unauthenticated request', () => {
    const next = vi.fn();
    requireRole('admin')({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects a normal user accessing an admin-only route', () => {
    const req = { user: { id: 'user-1', role: 'user' } };
    const next = vi.fn();
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('allows an admin to access an admin-only route', () => {
    const req = { user: { id: 'admin-1', role: 'admin' } };
    const next = vi.fn();
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows an authenticated user to access a user route requiring only auth', () => {
    const req = { user: { id: 'user-1', role: 'user' } };
    const next = vi.fn();
    requireRole('user', 'admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

// Sanity check that the two tokens above really do carry different roles,
// guarding against a copy-paste mistake making the suite vacuously pass.
describe('fixture sanity', () => {
  it('admin and user tokens carry distinct roles', () => {
    expect(jwt.decode(adminToken).role).toBe('admin');
    expect(jwt.decode(validToken).role).toBe('user');
  });
});
