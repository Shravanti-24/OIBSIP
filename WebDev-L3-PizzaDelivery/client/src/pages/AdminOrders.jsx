import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { PaymentStatusBadge, OrderStatusBadge, FulfillmentStatusBadge } from '../components/StatusBadge';
import { formatINR } from '../utils/currency';
import { summarizeOrderItems } from '../utils/orderItems';
import * as adminOrderService from '../services/adminOrder.service';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Order Received', label: 'Order Received' },
  { value: 'In Kitchen', label: 'In Kitchen' },
  { value: 'Sent to Delivery', label: 'Sent to Delivery' },
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function SummaryCard({ label, value, tone }) {
  const toneStyles = {
    default: 'text-ink-900',
    received: 'text-basil-600',
    kitchen: 'text-amber-600',
    delivery: 'text-tomato-600',
  };
  return (
    <div className="rounded-2xl border border-crust-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-ink-900/60">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${toneStyles[tone] || toneStyles.default}`}>{value}</p>
    </div>
  );
}

function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === option.value ? 'bg-ink-900 text-white' : 'bg-crust-50 text-ink-900/70 hover:bg-crust-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
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

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [summary, setSummary] = useState({ total: 0, orderReceived: 0, inKitchen: 0, sentToDelivery: 0 });
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  function load(status) {
    setError('');
    setOrders(null);
    adminOrderService
      .fetchAdminOrders(status && status !== 'all' ? { status } : undefined)
      .then((res) => {
        setOrders(res.data.data.orders);
        setSummary(res.data.data.summary);
      })
      .catch(() => setError('We could not load orders. Please try again.'));
  }

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <DashboardLayout title="Order Management" badge="Admin">
      {error && <ErrorState message={error} onRetry={() => load(statusFilter)} />}

      {!error && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Total orders" value={summary.total} tone="default" />
            <SummaryCard label="Order Received" value={summary.orderReceived} tone="received" />
            <SummaryCard label="In Kitchen" value={summary.inKitchen} tone="kitchen" />
            <SummaryCard label="Sent to Delivery" value={summary.sentToDelivery} tone="delivery" />
          </div>

          <div className="rounded-2xl border border-crust-100 bg-white p-4 shadow-sm">
            <FilterPills options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          </div>

          {orders === null && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <OrderRowSkeleton key={i} />
              ))}
            </div>
          )}

          {orders !== null && orders.length === 0 && (
            <EmptyState
              icon="🧾"
              title="No orders here"
              message="Orders appear here once a customer's payment is verified and confirmed."
            />
          )}

          {orders !== null && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="block rounded-2xl border border-crust-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-900/40">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink-900">
                        {order.customer?.name || 'Unknown customer'}
                      </p>
                      <p className="text-xs text-ink-900/50">{order.customer?.email}</p>
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
        </div>
      )}
    </DashboardLayout>
  );
}
