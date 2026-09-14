import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../services/password.service.js';

describe('password.service', () => {
  it('hashes a password to a bcrypt hash, never storing plaintext', async () => {
    const hash = await hashPassword('SuperSecret1');
    expect(hash).not.toBe('SuperSecret1');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('produces a different hash for the same password each time (unique salt)', async () => {
    const [hash1, hash2] = await Promise.all([
      hashPassword('SuperSecret1'),
      hashPassword('SuperSecret1'),
    ]);
    expect(hash1).not.toBe(hash2);
  });

  it('confirms a correct password against its hash', async () => {
    const hash = await hashPassword('SuperSecret1');
    await expect(comparePassword('SuperSecret1', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('SuperSecret1');
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });
});
