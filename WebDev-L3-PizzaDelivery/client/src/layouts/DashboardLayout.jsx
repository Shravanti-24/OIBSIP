import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function DashboardLayout({ title, badge, children }) {
  const { user, logout } = useAuth();
  const isAdmin = Boolean(badge);

  return (
    <div className="min-h-screen bg-crust-50">
      <header className={`border-b bg-white ${isAdmin ? 'border-tomato-500/30' : 'border-crust-100'}`}>
        {isAdmin && <div className="h-1 bg-tomato-500" aria-hidden="true" />}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 text-lg font-bold text-tomato-500">
            <span aria-hidden="true">🍕</span> Pizza House
            {badge && (
              <span className="ml-1 rounded-full bg-tomato-500 px-2 py-0.5 text-xs font-medium text-white">
                {badge}
              </span>
            )}
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="text-sm font-medium text-ink-900/70 hover:text-tomato-500">
                  Dashboard
                </Link>
                <Link to="/admin/orders" className="text-sm font-medium text-ink-900/70 hover:text-tomato-500">
                  Orders
                </Link>
                <Link to="/admin/inventory" className="text-sm font-medium text-ink-900/70 hover:text-tomato-500">
                  Inventory
                </Link>
              </>
            )}
            {user?.role !== 'admin' && (
              <Link to="/orders" className="text-sm font-medium text-ink-900/70 hover:text-tomato-500">
                My Orders
              </Link>
            )}
            <span className="hidden text-sm text-ink-900/70 sm:inline">{user?.name}</span>
            <Button variant="ghost" className="w-auto px-3 py-1.5 text-sm" onClick={logout}>
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <h1 className="mb-6 text-2xl font-semibold text-ink-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
