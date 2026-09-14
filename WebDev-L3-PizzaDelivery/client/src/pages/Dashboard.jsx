import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}!`}>
      <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
        <p className="text-ink-900/70">
          You are authenticated as <strong>{user?.email}</strong>. This dashboard is a placeholder for now
          - the pizza catalogue, custom builder, and order tracking will be added in a later phase of this
          build.
        </p>
        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-crust-50 p-4">
            <dt className="text-xs uppercase text-ink-900/50">Account</dt>
            <dd className="mt-1 font-medium text-ink-900">{user?.name}</dd>
          </div>
          <div className="rounded-lg bg-crust-50 p-4">
            <dt className="text-xs uppercase text-ink-900/50">Role</dt>
            <dd className="mt-1 font-medium capitalize text-ink-900">{user?.role}</dd>
          </div>
          <div className="rounded-lg bg-crust-50 p-4">
            <dt className="text-xs uppercase text-ink-900/50">Email verified</dt>
            <dd className="mt-1 font-medium text-basil-600">{user?.isVerified ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    </DashboardLayout>
  );
}
