import { describe, it, expect } from 'vitest';
import Inventory, { STOCK_STATUS, deriveStockStatus } from '../models/Inventory.js';
import { lowStockAlertEmailTemplate } from '../services/email.service.js';

// No live MongoDB is available in this test environment (see tests/setup.js).
// These exercise pure logic and model defaults only - the scheduled-check
// dedup/reset behavior is covered separately in lowStockCronCheck.test.js,
// which needs to mock the Inventory model and therefore can't share a file
// with a test that constructs a real Inventory document.

describe('deriveStockStatus', () => {
  it('is LOW_STOCK when quantity is positive but under the threshold', () => {
    expect(deriveStockStatus(3, 5)).toBe(STOCK_STATUS.LOW_STOCK);
  });

  it('is IN_STOCK when quantity equals the threshold', () => {
    expect(deriveStockStatus(5, 5)).toBe(STOCK_STATUS.IN_STOCK);
  });

  it('is OUT_OF_STOCK when quantity is zero, regardless of threshold', () => {
    expect(deriveStockStatus(0, 5)).toBe(STOCK_STATUS.OUT_OF_STOCK);
  });

  it('is IN_STOCK when quantity is comfortably above the threshold', () => {
    expect(deriveStockStatus(8, 5)).toBe(STOCK_STATUS.IN_STOCK);
  });
});

describe('Inventory model low-stock alert fields', () => {
  it('defaults lowStockAlertSent to false and lowStockAlertSentAt to null', () => {
    const doc = new Inventory({ ingredient: '000000000000000000000001', quantity: 3, threshold: 5, unit: 'g' });
    expect(doc.lowStockAlertSent).toBe(false);
    expect(doc.lowStockAlertSentAt).toBeNull();
  });
});

describe('lowStockAlertEmailTemplate', () => {
  it('names the alert and distinctly labels low-stock vs out-of-stock rows', () => {
    const { subject, html } = lowStockAlertEmailTemplate({
      items: [
        { name: 'Mozzarella', category: 'cheese', quantity: 2, threshold: 4, unit: 'kg', status: 'low-stock' },
        { name: 'Classic Crust', category: 'base', quantity: 0, threshold: 5, unit: 'units', status: 'out-of-stock' },
      ],
    });

    expect(subject).toMatch(/Low Stock Alert/);
    expect(html).toContain('Mozzarella');
    expect(html).toContain('LOW STOCK');
    expect(html).toContain('Classic Crust');
    expect(html).toContain('OUT OF STOCK');
  });
});
