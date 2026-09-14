import { describe, it, expect } from 'vitest';
import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } from '../constants/orderStatus.js';

describe('ORDER_STATUSES', () => {
  it('contains exactly the three required lifecycle stages, in order', () => {
    expect(ORDER_STATUSES).toEqual(['Order Received', 'In Kitchen', 'Sent to Delivery']);
  });
});

describe('ORDER_STATUS_TRANSITIONS', () => {
  it('allows Order Received -> In Kitchen', () => {
    expect(ORDER_STATUS_TRANSITIONS['Order Received']).toBe('In Kitchen');
  });

  it('allows In Kitchen -> Sent to Delivery', () => {
    expect(ORDER_STATUS_TRANSITIONS['In Kitchen']).toBe('Sent to Delivery');
  });

  it('allows no further progression once Sent to Delivery', () => {
    expect(ORDER_STATUS_TRANSITIONS['Sent to Delivery']).toBeNull();
  });

  it('has an entry for every known status and no others', () => {
    expect(Object.keys(ORDER_STATUS_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort());
  });
});
