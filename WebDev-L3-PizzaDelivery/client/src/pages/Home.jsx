import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const FEATURES = [
  { icon: '🍕', label: 'Build your own pizza' },
  { icon: '📍', label: 'Live order tracking' },
  { icon: '🔒', label: 'Secure Razorpay checkout' },
];

export default function Home() {
  const { user } = useAuth();
  const homeLink = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/register';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-crust-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-blush-100 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-[-10%] h-96 w-96 rounded-full bg-crust-100 blur-3xl"
      />

      <nav className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 text-xl font-bold text-tomato-500">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-tomato-500 text-lg text-white"
          >
            🍕
          </span>
          Pizza House
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

      <main className="relative mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <span className="rounded-full bg-blush-100 px-4 py-1 text-sm font-medium text-tomato-600">
          Freshly baked, made to order
        </span>
        <h1 className="mt-5 text-4xl font-bold text-ink-900 sm:text-5xl">
          Pizza, <span className="text-tomato-500">built your way</span> - tracked door to door
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-900/70">
          Pick a house favourite or build a custom pizza base by base, sauce by sauce. Pay securely with
          Razorpay and follow your order live, from the kitchen to your door.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to={homeLink}>
            <Button className="w-auto px-8">{user ? 'Continue' : 'Get started'}</Button>
          </Link>
          {!user && (
            <Link to="/login">
              <Button variant="ghost" className="w-auto px-8">
                I already have an account
              </Button>
            </Link>
          )}
        </div>

        <dl className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 rounded-xl border border-crust-100 bg-white/60 px-4 py-3 text-sm font-medium text-ink-900"
            >
              <span aria-hidden="true" className="text-lg">
                {feature.icon}
              </span>
              {feature.label}
            </div>
          ))}
        </dl>
      </main>

      <footer className="relative mx-auto w-full max-w-5xl px-4 pb-6 text-center text-xs text-ink-900/50">
        Oasis Infobyte Web Development &amp; Designing Internship - Level 3, Task 1
      </footer>
    </div>
  );
}
