import { describe, it, expect } from 'vitest';
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validators';

describe('validateEmail', () => {
  it('accepts a well-formed address', () => {
    expect(validateEmail('ada@example.com')).toBe('');
  });

  it('requires a value, treating whitespace as empty', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it.each(['ada', 'ada@', 'ada@example', 'ada example.com', 'a@b@c.com'])('rejects %s', (input) => {
    expect(validateEmail(input)).toBe('Enter a valid email address');
  });
});

describe('validateName', () => {
  it('accepts a normal name', () => {
    expect(validateName('Ada')).toBe('');
  });

  it('requires a value', () => {
    expect(validateName('  ')).toBe('Name is required');
  });

  it('requires at least two non-space characters', () => {
    expect(validateName('A')).toBe('Name must be at least 2 characters');
    expect(validateName(' A ')).toBe('Name must be at least 2 characters');
  });
});

describe('validatePassword', () => {
  it('accepts 8+ characters including a digit', () => {
    expect(validatePassword('pizza123')).toBe('');
  });

  it('requires a value', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('enforces the minimum length', () => {
    expect(validatePassword('pizza1')).toBe('Password must be at least 8 characters');
  });

  it('requires at least one number', () => {
    expect(validatePassword('pizzapizza')).toBe('Password must contain at least one number');
  });
});

describe('validateConfirmPassword', () => {
  it('accepts a matching confirmation', () => {
    expect(validateConfirmPassword('pizza123', 'pizza123')).toBe('');
  });

  it('requires the confirmation field', () => {
    expect(validateConfirmPassword('pizza123', '')).toBe('Please confirm your password');
  });

  it('rejects a mismatch', () => {
    expect(validateConfirmPassword('pizza123', 'pizza124')).toBe('Passwords do not match');
  });
});
