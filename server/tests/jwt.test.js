import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAuthToken, verifyAuthToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const fakeUser = { _id: { toString: () => '507f1f77bcf86cd799439011' }, role: 'user' };

describe('jwt utils', () => {
  it('signs a token containing only id and role claims', () => {
    const token = signAuthToken(fakeUser);
    const decoded = jwt.decode(token);
    expect(decoded.sub).toBe('507f1f77bcf86cd799439011');
    expect(decoded.role).toBe('user');
    expect(decoded).not.toHaveProperty('password');
    expect(decoded).not.toHaveProperty('passwordHash');
  });

  it('verifies a token it issued', () => {
    const token = signAuthToken(fakeUser);
    const payload = verifyAuthToken(token);
    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
  });

  it('rejects a token signed with the wrong secret', () => {
    const badToken = jwt.sign({ sub: 'x', role: 'user' }, 'wrong-secret');
    expect(() => verifyAuthToken(badToken)).toThrow();
  });

  it('rejects an expired token', () => {
    const expiredToken = jwt.sign({ sub: 'x', role: 'user' }, env.jwtSecret, { expiresIn: -10 });
    expect(() => verifyAuthToken(expiredToken)).toThrow(/expired/i);
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAuthToken('not-a-real-token')).toThrow();
  });
});
