import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { clearOrderDraft, loadOrderDraft, saveOrderDraft } from '../utils/orderDraft';

describe('order draft storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadOrderDraft()).toBeNull();
  });

  it('round-trips a saved draft', () => {
    saveOrderDraft({ type: 'ready-made', pizza: { id: 'p1', name: 'Margherita' }, price: 250 });

    const draft = loadOrderDraft();
    expect(draft).toMatchObject({
      type: 'ready-made',
      pizza: { id: 'p1', name: 'Margherita' },
      price: 250,
    });
  });

  it('stamps the draft with a save time', () => {
    saveOrderDraft({ type: 'custom', price: 310 });
    expect(Date.parse(loadOrderDraft().savedAt)).not.toBeNaN();
  });

  it('replaces the previous draft rather than appending to it', () => {
    saveOrderDraft({ type: 'ready-made', price: 250 });
    saveOrderDraft({ type: 'custom', price: 310 });
    expect(loadOrderDraft()).toMatchObject({ type: 'custom', price: 310 });
  });

  it('clears the draft', () => {
    saveOrderDraft({ type: 'custom', price: 310 });
    clearOrderDraft();
    expect(loadOrderDraft()).toBeNull();
  });

  it('returns null instead of throwing when the stored value is corrupt', () => {
    sessionStorage.setItem('pizza:orderDraft', '{not json');
    expect(loadOrderDraft()).toBeNull();
  });

  it('returns null instead of throwing when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage is disabled');
    });
    expect(loadOrderDraft()).toBeNull();
  });
});
