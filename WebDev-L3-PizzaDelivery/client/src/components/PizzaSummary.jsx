import Button from './Button';

function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-900/50">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value || '—'}</dd>
    </div>
  );
}

export default function PizzaSummary({ base, sauce, cheese, vegetables, price, onContinue, canContinue, isSubmitting }) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-2xl border border-crust-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Your Pizza</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Base" value={base?.name} />
          <Row label="Sauce" value={sauce?.name} />
          <Row label="Cheese" value={cheese?.name} />
          <div>
            <dt className="text-ink-900/50">Vegetables</dt>
            <dd className="mt-1 text-ink-900">
              {vegetables.length ? vegetables.map((v) => v.name).join(', ') : 'None selected'}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-crust-100 pt-4">
          <span className="text-sm text-ink-900/60">Total</span>
          <span className="text-xl font-bold text-tomato-500">{formatPrice(price)}</span>
        </div>
        <Button className="mt-5" onClick={onContinue} disabled={!canContinue} isLoading={isSubmitting}>
          Continue
        </Button>
      </div>
    </aside>
  );
}
