import { describe, it, expect } from 'vitest';
import User from '../models/User.js';

describe('User model schema', () => {
  it('requires name, email and passwordHash', () => {
    const user = new User({});
    const err = user.validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.passwordHash).toBeDefined();
  });

  it('rejects an invalid email format', () => {
    const user = new User({ name: 'Ada', email: 'not-an-email', passwordHash: 'x' });
    const err = user.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  it('defaults role to "user" and isVerified to false', () => {
    const user = new User({ name: 'Ada', email: 'ada@example.com', passwordHash: 'x' });
    expect(user.role).toBe('user');
    expect(user.isVerified).toBe(false);
  });

  it('only allows role "user" or "admin"', () => {
    const user = new User({
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'x',
      role: 'superadmin',
    });
    const err = user.validateSync();
    expect(err.errors.role).toBeDefined();
  });

  it('accepts a valid user document', () => {
    const user = new User({ name: 'Ada Lovelace', email: 'Ada@Example.com', passwordHash: 'x' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });
});
