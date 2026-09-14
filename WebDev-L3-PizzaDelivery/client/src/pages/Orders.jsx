import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { PaymentStatusBadge, OrderStatusBadge, FulfillmentStatusBadge } from '../components/StatusBadge';
import { formatINR } from '../utils/currency';
import { summarizeOrderItems } from '../utils/orderItems';
import * as orderService from '../services/order.service';

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function OrderRowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-crust-100 bg-white p-5">
      <div className="h-4 w-1/3 rounded bg-crust-100" />
      <div className="mt-3 h-3 w-2/3 rounded bg-crust-100" />
      <div className="mt-3 h-3 w-1/4 rounded bg-crust-100" />
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    setOrders(null);
    orderService
      .fetchOrders()
      .then((res) => setOrders(res.data.data.orders))
      .catch(() => setError('We could not load your orders. Please try again.'));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout title="Your orders">
      {error && <ErrorState message={error} onRetry={load} />}

      {!error && orders === null && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && orders !== null && orders.length === 0 && (
        <EmptyState
          icon="🧾"
          title="No orders yet"
          message="Once you place an order, it will show up here with its payment and delivery status."
        />
      )}

      {!error && orders !== null && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block rounded-2xl border border-crust-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
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
              <p className="mt-3 text-sm text-ink-900/80">{summarizeOrderItems(order.items)}</p>
              <p className="mt-3 text-lg font-semibold text-tomato-500">{formatINR(order.totalAmount)}</p>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
