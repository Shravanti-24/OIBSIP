import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { PaymentStatusBadge, OrderStatusBadge, FulfillmentStatusBadge } from '../components/StatusBadge';
import { formatINR } from '../utils/currency';
import { describeOrderItem } from '../utils/orderItems';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import * as orderService from '../services/order.service';

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { payForOrder, isBusy: isPaying, error: paymentError } = useRazorpayCheckout();
  const justPaid = Boolean(location.state?.justPaid);

  function load() {
    setError('');
    setIsLoading(true);
    orderService
      .fetchOrderById(id)
      .then((res) => setOrder(res.data.data.order))
      .catch((err) => {
        setError(
          err.response?.status === 404
            ? 'This order could not be found.'
            : 'We could not load this order. Please try again.',
        );
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleRetryPayment() {
    payForOrder(order._id, {
      onVerified: (paidOrder) => setOrder(paidOrder),
    });
  }

  return (
    <DashboardLayout title="Order details">
      {isLoading && <Spinner label="Loading order..." />}

      {!isLoading && error && <ErrorState message={error} onRetry={load} />}

      {!isLoading && !error && order && (
        <div className="mx-auto max-w-2xl space-y-6">
          {justPaid && order.paymentStatus === 'paid' && (
            <div className="rounded-2xl border border-basil-500/30 bg-basil-500/10 p-6 text-center">
              <p className="text-3xl" aria-hidden="true">
                🎉
              </p>
              <h2 className="mt-2 text-lg font-semibold text-basil-600">Payment successful!</h2>
              <p className="mt-1 text-sm text-ink-900/70">Your order has been confirmed.</p>
            </div>
          )}

          <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-900/40">
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-ink-900/70">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PaymentStatusBadge status={order.paymentStatus} />
                <OrderStatusBadge status={order.orderStatus} />
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              </div>
            </div>

            <dl className="mt-6 divide-y divide-crust-50">
              {order.items.map((item, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <dt className="font-medium text-ink-900">{describeOrderItem(item)}</dt>
                    <dd className="mt-1 text-xs text-ink-900/50">{formatINR(item.unitPrice)} each</dd>
                  </div>
                  <dd className="whitespace-nowrap font-medium text-ink-900">{formatINR(item.itemTotal)}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-crust-100 pt-4">
              <span className="text-ink-900/60">Total ({order.currency})</span>
              <span className="text-2xl font-bold text-tomato-500">{formatINR(order.totalAmount)}</span>
            </div>

            {order.paymentStatus === 'paid' && order.fulfillmentStatus === 'blocked' && (
              <Alert type="error">
                Payment was successful, but one or more items in your order are currently unavailable. Our team
                will reach out to resolve this.
              </Alert>
            )}

            {order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'blocked' && (
              <p className="mt-4 rounded-lg bg-crust-50 px-4 py-3 text-sm text-ink-900/70">
                Your order has been received and is next in line for the kitchen. Order tracking will be
                available in a later update.
              </p>
            )}

            {order.paymentStatus !== 'paid' && (
              <div className="mt-6 space-y-3">
                {paymentError && <Alert type="error">{paymentError}</Alert>}
                <Button onClick={handleRetryPayment} disabled={isPaying} isLoading={isPaying}>
                  {order.paymentStatus === 'failed' ? 'Try payment again' : 'Complete payment'}
                </Button>
              </div>
            )}

            <Link to="/orders" className="mt-6 block text-center text-sm text-tomato-500 hover:underline">
              Back to your orders
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
