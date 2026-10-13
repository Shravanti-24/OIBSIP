import { describe, it, expect } from 'vitest';
import { describeOrderItem, summarizeOrderItems } from '../utils/orderItems';

const customItem = {
  type: 'custom',
  quantity: 1,
  base: { name: 'Thin Crust' },
  sauce: { name: 'Marinara' },
  cheese: { name: 'Mozzarella' },
  vegetables: [{ name: 'Olives' }, { name: 'Capsicum' }],
};

describe('describeOrderItem', () => {
  it('names a ready-made pizza with its quantity', () => {
    expect(describeOrderItem({ type: 'ready-made', name: 'Margherita', quantity: 2 })).toBe(
      'Margherita × 2',
    );
  });

  it('lists a custom pizza as base, sauce, cheese, then vegetables in order', () => {
    expect(describeOrderItem(customItem)).toBe(
      'Custom Pizza (Thin Crust, Marinara, Mozzarella, Olives, Capsicum) × 1',
    );
  });

  it('omits missing parts instead of rendering "undefined"', () => {
    expect(describeOrderItem({ type: 'custom', quantity: 1, base: { name: 'Pan' } })).toBe(
      'Custom Pizza (Pan) × 1',
    );
  });

  it('handles a custom pizza with no vegetables', () => {
    expect(describeOrderItem({ ...customItem, vegetables: [] })).toBe(
      'Custom Pizza (Thin Crust, Marinara, Mozzarella) × 1',
    );
  });
});

describe('summarizeOrderItems', () => {
  it('joins multiple items with a semicolon', () => {
    expect(
      summarizeOrderItems([
        { type: 'ready-made', name: 'Margherita', quantity: 1 },
        { type: 'ready-made', name: 'Farmhouse', quantity: 3 },
      ]),
    ).toBe('Margherita × 1; Farmhouse × 3');
  });

  it('returns an empty string for no items, null or undefined', () => {
    expect(summarizeOrderItems([])).toBe('');
    expect(summarizeOrderItems(null)).toBe('');
    expect(summarizeOrderItems(undefined)).toBe('');
  });
});
