import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function Home() {
  const { user } = useAuth();
  const homeLink = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/register';

  return (
    <div className="flex min-h-screen flex-col bg-crust-50">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 text-xl font-bold text-tomato-500">
          <span aria-hidden="true">🍕</span> Pizza Delivery
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link to={homeLink}>
              <Button className="w-auto px-5">{user.role === 'admin' ? 'Admin panel' : 'Dashboard'}</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="w-auto px-5">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="w-auto px-5">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold text-ink-900 sm:text-5xl">
          Freshly baked pizza, <span className="text-tomato-500">built your way</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-900/70">
          Sign up to build your own pizza, track your order in real time, and get it delivered hot to your
          door. Our full ordering experience is coming soon.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to={homeLink}>
            <Button className="w-auto px-8">{user ? 'Continue' : 'Get started'}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
