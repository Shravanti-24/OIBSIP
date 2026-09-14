import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Admin dashboard" badge="Admin">
      <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
        <p className="text-ink-900/70">
          Signed in as admin <strong>{user?.email}</strong>. Inventory management, stock control, and order
          management will be built in a later phase of this project.
        </p>
      </div>
    </DashboardLayout>
  );
}
