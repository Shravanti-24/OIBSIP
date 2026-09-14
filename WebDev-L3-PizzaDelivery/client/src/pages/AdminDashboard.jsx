import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Admin dashboard" badge="Admin">
      <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
        <p className="text-ink-900/70">
          Signed in as admin <strong>{user?.email}</strong>.
        </p>

        <Link
          to="/admin/inventory"
          className="mt-6 flex items-center justify-between rounded-xl border border-crust-100 p-5 transition-colors hover:border-tomato-500/40 hover:bg-crust-50"
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

        <p className="mt-6 text-sm text-ink-900/50">
          Order management and low-stock email alerts will be built in a later phase of this project.
        </p>
      </div>
    </DashboardLayout>
  );
}
