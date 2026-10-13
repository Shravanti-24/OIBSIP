import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOrderStatusPolling } from '../hooks/useOrderStatusPolling';
import * as orderService from '../services/order.service';

vi.mock('../services/order.service', () => ({
  fetchOrderById: vi.fn(),
}));

const POLL_MS = 5000;

function orderResponse(orderStatus) {
  return { data: { data: { order: { _id: 'o1', orderStatus } } } };
}

/** Advances past one poll interval and lets the resulting promise settle. */
async function tick(times = 1) {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      vi.advanceTimersByTime(POLL_MS);
    });
  }
}

describe('useOrderStatusPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    orderService.fetchOrderById.mockResolvedValue(orderResponse('In Kitchen'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch anything before the first interval elapses', () => {
    renderHook(() => useOrderStatusPolling({ orderId: 'o1', active: true, onUpdate: vi.fn() }));
    expect(orderService.fetchOrderById).not.toHaveBeenCalled();
  });

  it('polls the order every 5 seconds while active', async () => {
    const onUpdate = vi.fn();
    renderHook(() => useOrderStatusPolling({ orderId: 'o1', active: true, onUpdate }));

    await tick();
    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(1);
    expect(orderService.fetchOrderById).toHaveBeenCalledWith('o1');
    expect(onUpdate).toHaveBeenCalledWith({ _id: 'o1', orderStatus: 'In Kitchen' });

    await tick(2);
    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(3);
  });

  it('stays idle when inactive', async () => {
    renderHook(() => useOrderStatusPolling({ orderId: 'o1', active: false, onUpdate: vi.fn() }));
    await tick(4);
    expect(orderService.fetchOrderById).not.toHaveBeenCalled();
  });

  it('stays idle without an order id', async () => {
    renderHook(() =>
      useOrderStatusPolling({ orderId: undefined, active: true, onUpdate: vi.fn() }),
    );
    await tick(4);
    expect(orderService.fetchOrderById).not.toHaveBeenCalled();
  });

  it('stops polling once it is switched off', async () => {
    const { rerender } = renderHook(
      ({ active }) => useOrderStatusPolling({ orderId: 'o1', active, onUpdate: vi.fn() }),
      { initialProps: { active: true } },
    );

    await tick();
    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(1);

    rerender({ active: false });
    await tick(3);
    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(1);
  });

  it('stops polling on unmount', async () => {
    const { unmount } = renderHook(() =>
      useOrderStatusPolling({ orderId: 'o1', active: true, onUpdate: vi.fn() }),
    );

    await tick();
    unmount();
    await tick(3);
    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(1);
  });

  it('runs exactly one poll per interval when the order id changes', async () => {
    const { rerender } = renderHook(
      ({ orderId }) => useOrderStatusPolling({ orderId, active: true, onUpdate: vi.fn() }),
      { initialProps: { orderId: 'o1' } },
    );

    await tick();
    rerender({ orderId: 'o2' });
    await tick();

    expect(orderService.fetchOrderById).toHaveBeenCalledTimes(2);
    expect(orderService.fetchOrderById).toHaveBeenLastCalledWith('o2');
  });

  it('flags a failed poll without losing the last known order', async () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    orderService.fetchOrderById.mockRejectedValueOnce(new Error('offline'));

    renderHook(() => useOrderStatusPolling({ orderId: 'o1', active: true, onUpdate, onError }));

    await tick();
    expect(onError).toHaveBeenLastCalledWith(true);
    expect(onUpdate).not.toHaveBeenCalled();

    // The next tick recovers rather than staying stuck in the failed state.
    await tick();
    expect(onError).toHaveBeenLastCalledWith(false);
    expect(onUpdate).toHaveBeenCalledWith({ _id: 'o1', orderStatus: 'In Kitchen' });
  });

  it('survives a missing onError callback', async () => {
    orderService.fetchOrderById.mockRejectedValueOnce(new Error('offline'));
    renderHook(() => useOrderStatusPolling({ orderId: 'o1', active: true, onUpdate: vi.fn() }));
    await expect(tick()).resolves.not.toThrow();
  });
});
