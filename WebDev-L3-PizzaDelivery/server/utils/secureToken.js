import crypto from 'node:crypto';

/**
 * Generates a random token for one-time use (email verification / password reset).
 * The raw token is sent to the user (email link); only its SHA-256 hash is persisted,
 * so a leaked database never exposes usable tokens.
 */
export function createSecureToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function isExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}
