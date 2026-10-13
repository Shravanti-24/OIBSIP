import { describe, it, expect } from 'vitest';
import User from '../models/User.js';

/**
 * Returns the ValidationError a document produces, or null when it is valid.
 * `validate()` is the supported API - `validateSync()` is deprecated in
 * Mongoose 9 and goes away in 10.
 */
function validationErrorOf(doc) {
  return doc.validate().then(
    () => null,
    (err) => err,
  );
}

describe('User model schema', () => {
  it('requires name, email and passwordHash', async () => {
    const user = new User({});
    const err = await validationErrorOf(user);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.passwordHash).toBeDefined();
  });

  it('rejects an invalid email format', async () => {
    const user = new User({ name: 'Ada', email: 'not-an-email', passwordHash: 'x' });
    const err = await validationErrorOf(user);
    expect(err.errors.email).toBeDefined();
  });

  it('defaults role to "user" and isVerified to false', () => {
    const user = new User({ name: 'Ada', email: 'ada@example.com', passwordHash: 'x' });
    expect(user.role).toBe('user');
    expect(user.isVerified).toBe(false);
  });

  it('only allows role "user" or "admin"', async () => {
    const user = new User({
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'x',
      role: 'superadmin',
    });
    const err = await validationErrorOf(user);
    expect(err.errors.role).toBeDefined();
  });

  it('accepts a valid user document', async () => {
    const user = new User({ name: 'Ada Lovelace', email: 'Ada@Example.com', passwordHash: 'x' });
    const err = await validationErrorOf(user);
    expect(err).toBeNull();
  });
});
