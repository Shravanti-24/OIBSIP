import { describe, it, expect } from 'vitest';
import { createSecureToken, hashToken, isExpired } from '../utils/secureToken.js';

describe('secureToken', () => {
  it('creates a random raw token and its deterministic hash', () => {
    const { rawToken, tokenHash } = createSecureToken();
    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toBe(hashToken(rawToken));
  });

  it('generates a different raw token on each call', () => {
    const a = createSecureToken();
    const b = createSecureToken();
    expect(a.rawToken).not.toBe(b.rawToken);
  });

  it('hashToken never reveals the raw token', () => {
    const { rawToken, tokenHash } = createSecureToken();
    expect(tokenHash).not.toContain(rawToken);
  });

  it('treats a null/undefined expiry as expired', () => {
    expect(isExpired(null)).toBe(true);
    expect(isExpired(undefined)).toBe(true);
  });

  it('treats a past date as expired', () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
  });

  it('treats a future date as not expired', () => {
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
