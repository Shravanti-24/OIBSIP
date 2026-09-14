import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OrderStatusProgress from '../components/OrderStatusProgress';
import { PaymentStatusBadge, FulfillmentStatusBadge } from '../components/StatusBadge';
import { formatINR } from '../utils/currency';
import { describeOrderItem } from '../utils/orderItems';
import { NEXT_ORDER_STATUS } from '../utils/orderStatus';
import * as adminOrderService from '../services/adminOrder.service';

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const NEXT_ACTION_LABEL = {
  'In Kitchen': 'Move to In Kitchen',
  'Sent to Delivery': 'Mark Sent to Delivery',
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  function load() {
    setError('');
    setIsLoading(true);
    adminOrderService
      .fetchAdminOrderById(id)
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

  async function handleAdvanceStatus(nextStatus) {
    setIsUpdating(true);
    setUpdateError('');
    setJustUpdated(false);
    try {
      const res = await adminOrderService.updateAdminOrderStatus(order._id, nextStatus);
      setOrder(res.data.data.order);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2500);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Could not update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  const nextStatus = order?.orderStatus ? NEXT_ORDER_STATUS[order.orderStatus] : null;

  return (
    <DashboardLayout title="Order details" badge="Admin">
      {isLoading && <Spinner label="Loading order..." />}

      {!isLoading && error && <ErrorState message={error} onRetry={load} />}

      {!isLoading && !error && order && (
        <div className="mx-auto max-w-2xl space-y-6">
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
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              </div>
            </div>

            <div className="mt-6 border-t border-crust-100 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-900/50">Customer</h2>
              <p className="mt-2 font-medium text-ink-900">{order.customer?.name || 'Unknown customer'}</p>
              <p className="text-sm text-ink-900/60">{order.customer?.email}</p>
            </div>

            <dl className="mt-6 divide-y divide-crust-50 border-t border-crust-100 pt-2">
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

            {(order.razorpayOrderId || order.razorpayPaymentId) && (
              <div className="mt-4 space-y-1 border-t border-crust-100 pt-4 text-xs text-ink-900/50">
                {order.razorpayOrderId && <p>Razorpay order: {order.razorpayOrderId}</p>}
                {order.razorpayPaymentId && <p>Razorpay payment: {order.razorpayPaymentId}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-900/50">Fulfillment status</h2>

            {!order.orderStatus && (
              <p className="mt-4 text-sm text-ink-900/60">
                This order has not been confirmed yet, so it has no fulfillment status.
              </p>
            )}

            {order.orderStatus && (
              <>
                <div className="mt-4">
                  <OrderStatusProgress status={order.orderStatus} />
                </div>

                {updateError && (
                  <div className="mt-4">
                    <Alert type="error">{updateError}</Alert>
                  </div>
                )}
                {justUpdated && !updateError && (
                  <div className="mt-4">
                    <Alert type="success">Status updated.</Alert>
                  </div>
                )}

                {nextStatus ? (
                  <Button
                    variant="admin"
                    className="mt-4 w-auto px-5 py-2.5"
                    onClick={() => handleAdvanceStatus(nextStatus)}
                    disabled={isUpdating}
                    isLoading={isUpdating}
                  >
                    {NEXT_ACTION_LABEL[nextStatus] || `Move to ${nextStatus}`}
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-basil-600">This order has reached its final status.</p>
                )}

                {order.statusHistory?.length > 0 && (
                  <div className="mt-6 border-t border-crust-100 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-900/40">
                      Status history
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-900/70">
                      {order.statusHistory.map((entry, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={index} className="flex items-center justify-between">
                          <span>{entry.status}</span>
                          <span className="text-xs text-ink-900/40">{formatDate(entry.changedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <Link to="/admin/orders" className="block text-center text-sm text-tomato-500 hover:underline">
            Back to all orders
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
