import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function DashboardLayout({ title, badge, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-crust-50">
      <header className="border-b border-crust-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-lg font-bold text-tomato-500">
            <span aria-hidden="true">🍕</span> Pizza Delivery
            {badge && (
              <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-xs font-medium text-white">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user?.role !== 'admin' && (
              <Link to="/orders" className="text-sm font-medium text-ink-900/70 hover:text-tomato-500">
                My Orders
              </Link>
            )}
            <span className="text-sm text-ink-900/70">{user?.name}</span>
            <Button variant="ghost" className="w-auto px-3 py-1.5 text-sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-ink-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
