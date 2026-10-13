import User from '../models/User.js';
import { createSecureToken, hashToken, isExpired } from '../utils/secureToken.js';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function issueEmailVerificationToken(user) {
  const { rawToken, tokenHash } = createSecureToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await user.save();
  return rawToken;
}

/**
 * Looks up the user matching a raw verification token, enforcing expiry.
 * Returns null (rather than throwing) for invalid/expired tokens so callers
 * can respond with a uniform "invalid or expired" message.
 */
export async function consumeEmailVerificationToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash }).select(
    '+emailVerificationTokenHash +emailVerificationExpires',
  );

  if (!user || isExpired(user.emailVerificationExpires)) {
    return null;
  }

  user.isVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save();
  return user;
}

export async function issuePasswordResetToken(user) {
  const { rawToken, tokenHash } = createSecureToken();
  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();
  return rawToken;
}

export async function findUserByResetToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const user = await User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpires +passwordHash',
  );

  if (!user || isExpired(user.passwordResetExpires)) {
    return null;
  }

  return user;
}

export async function invalidatePasswordResetToken(user) {
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
}
