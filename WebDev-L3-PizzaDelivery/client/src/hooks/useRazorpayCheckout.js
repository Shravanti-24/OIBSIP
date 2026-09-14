import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import * as paymentService from '../services/payment.service';
import { loadRazorpayScript } from '../utils/loadRazorpayScript';

/**
 * Drives the Razorpay Standard Checkout flow for one local order: loads the
 * checkout script, asks the backend to create/reuse the Razorpay order,
 * opens the real Razorpay modal, and sends the resulting payment response
 * to the backend for signature verification. The frontend never marks a
 * payment as successful on its own - `onVerified` only fires after the
 * backend confirms it.
 */
export function useRazorpayCheckout() {
  const { user } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const payForOrder = useCallback(
    async (orderId, { onVerified } = {}) => {
      setError('');
      setIsBusy(true);

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('We could not load the payment gateway. Check your connection and try again.');
          setIsBusy(false);
          return;
        }

        const res = await paymentService.createRazorpayOrder(orderId);
        const { razorpayOrderId, amount, currency, keyId } = res.data.data;

        if (!keyId || !razorpayOrderId) {
          setError('Payment processing is not configured yet. Please try again later.');
          setIsBusy(false);
          return;
        }

        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Pizza Delivery',
          description: 'Pizza order payment',
          order_id: razorpayOrderId,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#e0442b' },
          handler: async (response) => {
            try {
              const verifyRes = await paymentService.verifyPayment({
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setIsBusy(false);
              onVerified?.(verifyRes.data.data.order);
            } catch (err) {
              setIsBusy(false);
              setError(
                err.response?.data?.message ||
                  'We could not verify your payment. If money was deducted, it will be refunded automatically - contact support with your order reference if it is not.',
              );
            }
          },
          modal: {
            ondismiss: () => {
              setIsBusy(false);
              setError('Payment cancelled. You can try again anytime.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setIsBusy(false);
          setError(`Payment failed: ${response.error?.description || 'Please try again.'}`);
        });
        rzp.open();
      } catch (err) {
        setIsBusy(false);
        setError(err.response?.data?.message || 'We could not start checkout. Please try again.');
      }
    },
    [user],
  );

  return { payForOrder, isBusy, error, setError };
}
