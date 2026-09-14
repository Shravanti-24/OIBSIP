import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks are hoisted above these imports by vitest, so every import of
// Inventory/email.service below (direct or transitive, e.g. from
// lowStockAlert.service.js) resolves to the mocked version for this whole
// file. Kept in its own file, separate from lowStockAlert.test.js, which
// needs the *real* Inventory model to construct a document.
vi.mock('../models/Inventory.js', async () => {
  const actual = await vi.importActual('../models/Inventory.js');
  return { ...actual, default: { find: vi.fn(), updateMany: vi.fn() } };
});

vi.mock('../services/email.service.js', async () => {
  const actual = await vi.importActual('../services/email.service.js');
  return { ...actual, sendEmail: vi.fn() };
});

vi.mock('../config/env.js', () => ({ env: { adminEmail: 'admin@example.com' } }));

import Inventory from '../models/Inventory.js';
import { sendEmail } from '../services/email.service.js';
import { env } from '../config/env.js';
import { checkLowStockAndNotify } from '../services/lowStockAlert.service.js';

function mockInventoryDocs(docs) {
  Inventory.find.mockReturnValue({ populate: vi.fn().mockResolvedValue(docs) });
}

function makeDoc({ id, quantity, threshold, lowStockAlertSent = false, unit = 'portion' }) {
  return {
    _id: id,
    quantity,
    threshold,
    unit,
    lowStockAlertSent,
    ingredient: { name: `Item ${id}`, category: 'base' },
  };
}

describe('checkLowStockAndNotify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.adminEmail = 'admin@example.com';
    Inventory.updateMany.mockResolvedValue({});
    sendEmail.mockResolvedValue({ skipped: true });
  });

  it('sends one consolidated email for newly-low items and marks them as alerted', async () => {
    mockInventoryDocs([
      makeDoc({ id: '1', quantity: 3, threshold: 5 }),
      makeDoc({ id: '2', quantity: 8, threshold: 5 }),
    ]);

    const result = await checkLowStockAndNotify();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(result.alerted).toBe(1);
    expect(Inventory.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['1'] } },
      { $set: { lowStockAlertSent: true, lowStockAlertSentAt: expect.any(Date) } },
    );
  });

  it('does not send a duplicate alert for an item already marked as alerted', async () => {
    mockInventoryDocs([makeDoc({ id: '1', quantity: 2, threshold: 5, lowStockAlertSent: true })]);

    const result = await checkLowStockAndNotify();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(result.alerted).toBe(0);
  });

  it('resets the alert flag once stock is restocked back to the threshold or above', async () => {
    mockInventoryDocs([makeDoc({ id: '1', quantity: 10, threshold: 5, lowStockAlertSent: true })]);

    await checkLowStockAndNotify();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(Inventory.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['1'] } },
      { $set: { lowStockAlertSent: false, lowStockAlertSentAt: null } },
    );
  });

  it('alerts again after a reset item dips below threshold a second time', async () => {
    // Simulates: previously restocked (flag already cleared) and now low again.
    mockInventoryDocs([makeDoc({ id: '1', quantity: 4, threshold: 5, lowStockAlertSent: false })]);

    const result = await checkLowStockAndNotify();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(result.alerted).toBe(1);
  });

  it('does not mark the item as alerted when the email send fails, so the next run retries it', async () => {
    mockInventoryDocs([makeDoc({ id: '1', quantity: 1, threshold: 5 })]);
    sendEmail.mockRejectedValue(new Error('provider down'));

    const result = await checkLowStockAndNotify();

    expect(result.emailFailed).toBe(true);
    expect(Inventory.updateMany).not.toHaveBeenCalledWith(
      { _id: { $in: ['1'] } },
      expect.objectContaining({ $set: expect.objectContaining({ lowStockAlertSent: true }) }),
    );
  });

  it('skips the check when ADMIN_EMAIL is not configured, without touching the database', async () => {
    env.adminEmail = '';

    const result = await checkLowStockAndNotify();

    expect(Inventory.find).not.toHaveBeenCalled();
    expect(result.skipped).toBe('no-admin-email');
  });

  it('propagates a database error to the caller instead of swallowing it', async () => {
    Inventory.find.mockReturnValue({ populate: vi.fn().mockRejectedValue(new Error('connection lost')) });

    // The service itself lets this throw; jobs/lowStockCron.job.js is what
    // catches it so a transient DB error never crashes the server.
    await expect(checkLowStockAndNotify()).rejects.toThrow('connection lost');
  });
});
