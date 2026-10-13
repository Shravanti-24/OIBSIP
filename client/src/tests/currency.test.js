import { describe, it, expect } from 'vitest';
import { formatINR } from '../utils/currency';

describe('formatINR', () => {
  it('renders whole rupees with the ₹ symbol and no decimals', () => {
    expect(formatINR(250)).toBe('₹250');
  });

  it('groups thousands the Indian way (lakh/crore grouping)', () => {
    expect(formatINR(125000)).toBe('₹1,25,000');
  });

  it('rounds away paise rather than showing decimals', () => {
    expect(formatINR(249.5)).toBe('₹250');
  });

  it('accepts a numeric string', () => {
    expect(formatINR('399')).toBe('₹399');
  });

  it('falls back to zero for null, undefined and unparseable input', () => {
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
    expect(formatINR('not a number')).toBe('₹0');
  });
});
