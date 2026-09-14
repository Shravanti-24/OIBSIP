import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import * as adminOrderService from '../services/adminOrder.service';

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
      <p className={`mt-1 text-3xl font-bold ${toneStyles[tone] || toneStyles.default}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    adminOrderService
      .fetchAdminOrders({ limit: 1 })
      .then((res) => setSummary(res.data.data.summary))
      .catch(() => setSummary(null));
  }, []);

  return (
    <DashboardLayout title="Admin dashboard" badge="Admin">
      <div className="space-y-6">
        <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
          <p className="text-ink-900/70">
            Signed in as admin <strong>{user?.email}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Total orders" value={summary?.total} tone="default" />
          <SummaryCard label="Order Received" value={summary?.orderReceived} tone="received" />
          <SummaryCard label="In Kitchen" value={summary?.inKitchen} tone="kitchen" />
          <SummaryCard label="Sent to Delivery" value={summary?.sentToDelivery} tone="delivery" />
        </div>

        <div className="rounded-2xl border border-crust-100 bg-white p-4 shadow-sm">
          <Link
            to="/admin/orders"
            className="flex items-center justify-between rounded-xl p-5 transition-colors hover:bg-crust-50"
          >
            <div>
              <p className="font-semibold text-ink-900">Order Management</p>
              <p className="mt-1 text-sm text-ink-900/60">
                View incoming orders, see customer and payment details, and move orders through the kitchen.
              </p>
            </div>
            <span aria-hidden="true" className="text-2xl text-tomato-500">
              →
            </span>
          </Link>

          <Link
            to="/admin/inventory"
            className="flex items-center justify-between rounded-xl p-5 transition-colors hover:bg-crust-50"
          >
            <div>
              <p className="font-semibold text-ink-900">Inventory Management</p>
              <p className="mt-1 text-sm text-ink-900/60">
                View stock levels, update quantities and thresholds, and spot low/out-of-stock ingredients.
              </p>
            </div>
            <span aria-hidden="true" className="text-2xl text-tomato-500">
              →
            </span>
          </Link>
        </div>

        <p className="text-sm text-ink-900/50">
          Live status polling and low-stock email alerts will be built in a later phase of this project.
        </p>
      </div>
    </DashboardLayout>
  );
}
