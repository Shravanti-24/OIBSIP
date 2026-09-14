import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';
import { loadOrderDraft } from '../utils/orderDraft';

function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-crust-50 py-2 last:border-b-0">
      <dt className="text-ink-900/50">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}

export default function OrderReview() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(undefined);

  useEffect(() => {
    setDraft(loadOrderDraft());
  }, []);

  useEffect(() => {
    if (draft === null) {
      navigate('/dashboard', { replace: true });
    }
  }, [draft, navigate]);

  if (draft === undefined || draft === null) {
    return (
      <DashboardLayout title="Order summary">
        <p className="text-ink-900/60">Loading your selection...</p>
      </DashboardLayout>
    );
  }

  const isCustom = draft.type === 'custom';

  return (
    <DashboardLayout title="Your pizza is ready">
      <div className="mx-auto max-w-xl rounded-2xl border border-crust-100 bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-basil-500/10 px-3 py-1 text-xs font-medium text-basil-600">
          {isCustom ? 'Custom pizza' : 'Ready-made pizza'}
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          {isCustom ? 'Your custom creation' : draft.pizza?.name}
        </h2>

        {isCustom ? (
          <dl className="mt-6 text-sm">
            <Row label="Base" value={draft.base?.name} />
            <Row label="Sauce" value={draft.sauce?.name} />
            <Row label="Cheese" value={draft.cheese?.name} />
            <Row
              label="Vegetables"
              value={draft.vegetables?.length ? draft.vegetables.map((v) => v.name).join(', ') : 'None'}
            />
          </dl>
        ) : (
          draft.pizza?.description && <p className="mt-3 text-sm text-ink-900/70">{draft.pizza.description}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-crust-100 pt-4">
          <span className="text-ink-900/60">Total</span>
          <span className="text-2xl font-bold text-tomato-500">{formatPrice(draft.price)}</span>
        </div>

        <div className="mt-8 space-y-3">
          <Button disabled title="Checkout is coming in a later phase of this build">
            Proceed to checkout
          </Button>
          <p className="text-center text-xs text-ink-900/50">
            Checkout, payment and order tracking will be available in a later phase of this build.
          </p>
          <Link
            to={isCustom ? '/customize' : '/dashboard'}
            className="block text-center text-sm text-tomato-500 hover:underline"
          >
            Edit selection
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
