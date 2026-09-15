import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-crust-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-tomato-500">
          <span aria-hidden="true">🍕</span> Pizza House
        </Link>
        <div className="rounded-2xl border border-crust-100 bg-white p-8 shadow-lg shadow-crust-500/5">
          <h1 className="text-center text-xl font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-sm text-ink-900/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-900/70">{footer}</div>}
      </div>
    </div>
  );
}
