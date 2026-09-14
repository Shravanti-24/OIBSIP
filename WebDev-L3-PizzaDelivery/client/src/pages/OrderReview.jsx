import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { loadOrderDraft, clearOrderDraft } from '../utils/orderDraft';
import { formatINR } from '../utils/currency';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import * as orderService from '../services/order.service';

const MAX_QUANTITY = 10;

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
  const [quantity, setQuantity] = useState(1);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState('');
  const { payForOrder, isBusy: isPaying, error: paymentError, setError: setPaymentError } = useRazorpayCheckout();

  useEffect(() => {
    setDraft(loadOrderDraft());
  }, []);

  useEffect(() => {
    if (draft === null) {
      navigate('/dashboard', { replace: true });
    }
  }, [draft, navigate]);

  const isCustom = draft?.type === 'custom';
  const displayTotal = useMemo(() => (draft ? draft.price * quantity : 0), [draft, quantity]);
  const isBusy = isCreatingOrder || isPaying;

  if (draft === undefined || draft === null) {
    return (
      <DashboardLayout title="Order summary">
        <p className="text-ink-900/60">Loading your selection...</p>
      </DashboardLayout>
    );
  }

  async function handleCheckout() {
    setCreateError('');
    setPaymentError('');
    setIsCreatingOrder(true);
    try {
      const itemPayload = isCustom
        ? {
            type: 'custom',
            baseId: draft.base.id,
            sauceId: draft.sauce.id,
            cheeseId: draft.cheese.id,
            vegetableIds: draft.vegetables.map((veg) => veg.id),
            quantity,
          }
        : { type: 'ready-made', pizzaId: draft.pizza.id, quantity };

      const res = await orderService.createOrder({ items: [itemPayload] });
      const order = res.data.data.order;
      setIsCreatingOrder(false);

      await payForOrder(order._id, {
        onVerified: (paidOrder) => {
          clearOrderDraft();
          navigate(`/orders/${paidOrder._id}`, { state: { justPaid: true } });
        },
      });
    } catch (err) {
      setIsCreatingOrder(false);
      const details = err.response?.data?.details;
      setCreateError(
        (details && details[0]?.message) ||
          err.response?.data?.message ||
          'We could not prepare your order. Please review your selection and try again.',
      );
    }
  }

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
          <span className="text-sm text-ink-900/60">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isBusy}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-crust-100 text-lg font-medium text-ink-900 transition-colors hover:bg-crust-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center font-medium text-ink-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              disabled={quantity >= MAX_QUANTITY || isBusy}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-crust-100 text-lg font-medium text-ink-900 transition-colors hover:bg-crust-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-crust-100 pt-4">
          <span className="text-ink-900/60">Total</span>
          <span className="text-2xl font-bold text-tomato-500">{formatINR(displayTotal)}</span>
        </div>

        {(createError || paymentError) && (
          <div className="mt-4">
            <Alert type="error">{createError || paymentError}</Alert>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Button onClick={handleCheckout} disabled={isBusy} isLoading={isBusy}>
            Pay {formatINR(displayTotal)}
          </Button>
          <p className="text-center text-xs text-ink-900/50">
            You will be redirected to Razorpay's secure checkout to complete payment.
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => navigate(isCustom ? '/customize' : '/dashboard')}
            className="block w-full text-center text-sm text-tomato-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit selection
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
