import { useEffect, useRef } from 'react';
import * as orderService from '../services/order.service';

const POLL_INTERVAL_MS = 5000;

/**
 * Polls GET /orders/:id every 5s while `active` is true, so the order
 * tracking UI reflects admin status changes without a manual refresh.
 * Reuses the existing user-scoped order-by-id endpoint - no separate status
 * route needed, and no risk of exposing another user's order this way.
 *
 * Exactly one interval runs at a time: the effect owns a single
 * setInterval and clears it whenever `orderId`/`active` change or the
 * component unmounts, before a new one (if any) is created.
 */
export function useOrderStatusPolling({ orderId, active, onUpdate, onError }) {
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!orderId || !active) return undefined;

    const intervalId = setInterval(() => {
      orderService
        .fetchOrderById(orderId)
        .then((res) => {
          onErrorRef.current?.(false);
          onUpdateRef.current?.(res.data.data.order);
        })
        .catch(() => {
          // A transient poll failure must not crash the page or wipe the
          // last known-good order - just flag it and let the next tick retry.
          onErrorRef.current?.(true);
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [orderId, active]);
}
