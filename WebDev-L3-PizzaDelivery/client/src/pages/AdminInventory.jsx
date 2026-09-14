import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { StockStatusBadge } from '../components/StatusBadge';
import * as inventoryService from '../services/inventory.service';

const CATEGORY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'base', label: 'Bases' },
  { value: 'sauce', label: 'Sauces' },
  { value: 'cheese', label: 'Cheeses' },
  { value: 'vegetable', label: 'Vegetables' },
];

const CATEGORY_LABELS = {
  base: 'Bases',
  sauce: 'Sauces',
  cheese: 'Cheeses',
  vegetable: 'Vegetables',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

function computeSummary(items) {
  return {
    total: items.length,
    lowStock: items.filter((item) => item.status === 'low-stock').length,
    outOfStock: items.filter((item) => item.status === 'out-of-stock').length,
  };
}

function SummaryCard({ label, value, tone }) {
  const toneStyles = {
    default: 'text-ink-900',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };
  return (
    <div className="rounded-2xl border border-crust-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-ink-900/60">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${toneStyles[tone] || toneStyles.default}`}>{value}</p>
    </div>
  );
}

function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-ink-900 text-white'
              : 'bg-crust-50 text-ink-900/70 hover:bg-crust-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QuantityStepper({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, Number(value) - 1))}
        disabled={disabled}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-crust-100 text-ink-900 transition-colors hover:bg-crust-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <input
        type="number"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-16 rounded-lg border border-crust-100 px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-tomato-500 focus:ring-2 focus:ring-tomato-500 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => onChange(Number(value) + 1)}
        disabled={disabled}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-crust-100 text-ink-900 transition-colors hover:bg-crust-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function InventoryRow({ item, draft, onDraftChange, onSave, isSaving, rowError, justSaved }) {
  const isDirty =
    draft && (Number(draft.quantity) !== item.quantity || Number(draft.threshold) !== item.threshold);
  const isInvalid =
    draft &&
    (draft.quantity === '' ||
      draft.threshold === '' ||
      Number(draft.quantity) < 0 ||
      Number(draft.threshold) < 0 ||
      Number.isNaN(Number(draft.quantity)) ||
      Number.isNaN(Number(draft.threshold)));

  return (
    <div className="flex flex-col gap-3 border-b border-crust-50 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink-900">{item.ingredientName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StockStatusBadge status={item.status} />
          <span className="text-xs text-ink-900/40">per {item.unit}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-900/60">Quantity</span>
          <QuantityStepper
            value={draft?.quantity ?? item.quantity}
            onChange={(val) => onDraftChange('quantity', val)}
            disabled={isSaving}
          />
        </div>
        <div>
          <label htmlFor={`threshold-${item.id}`} className="mb-1 block text-xs font-medium text-ink-900/60">
            Low-stock threshold
          </label>
          <input
            id={`threshold-${item.id}`}
            type="number"
            min="0"
            value={draft?.threshold ?? item.threshold}
            disabled={isSaving}
            onChange={(e) => onDraftChange('threshold', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-20 rounded-lg border border-crust-100 px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-tomato-500 focus:ring-2 focus:ring-tomato-500 disabled:opacity-60"
          />
        </div>
        <Button
          variant="admin"
          className="w-auto px-4 py-2 text-sm"
          onClick={onSave}
          disabled={!isDirty || isInvalid || isSaving}
          isLoading={isSaving}
        >
          Save
        </Button>
      </div>

      {rowError && <p className="w-full text-xs text-red-600 sm:text-right">{rowError}</p>}
      {justSaved && !rowError && <p className="w-full text-xs text-basil-600 sm:text-right">Saved</p>}
      {!rowError && !justSaved && isInvalid && (
        <p className="w-full text-xs text-red-600 sm:text-right">Enter a non-negative whole number.</p>
      )}
    </div>
  );
}

export default function AdminInventory() {
  const [items, setItems] = useState(null);
  const [summary, setSummary] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [savedFlashId, setSavedFlashId] = useState(null);

  function resetDrafts(nextItems) {
    const next = {};
    nextItems.forEach((item) => {
      next[item.id] = { quantity: item.quantity, threshold: item.threshold };
    });
    setDrafts(next);
  }

  function load() {
    setError('');
    setItems(null);
    inventoryService
      .fetchInventory()
      .then((res) => {
        const { items: fetchedItems, summary: fetchedSummary } = res.data.data;
        setItems(fetchedItems);
        setSummary(fetchedSummary);
        resetDrafts(fetchedItems);
        setRowErrors({});
      })
      .catch(() => setError('We could not load inventory. Please try again.'));
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (item) =>
        (categoryFilter === 'all' || item.category === categoryFilter) &&
        (statusFilter === 'all' || item.status === statusFilter),
    );
  }, [items, categoryFilter, statusFilter]);

  const sections = useMemo(() => {
    return Object.keys(CATEGORY_LABELS)
      .filter((category) => categoryFilter === 'all' || categoryFilter === category)
      .map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        items: filteredItems.filter((item) => item.category === category),
      }))
      .filter((section) => section.items.length > 0);
  }, [filteredItems, categoryFilter]);

  async function handleSave(id) {
    const draft = drafts[id];
    if (!draft) return;

    const quantity = Math.trunc(Number(draft.quantity));
    const threshold = Math.trunc(Number(draft.threshold));

    setSavingId(id);
    setRowErrors((prev) => ({ ...prev, [id]: '' }));

    const item = items.find((i) => i.id === id);

    try {
      const res = await inventoryService.updateInventoryItem(id, {
        quantity,
        threshold,
        version: item?.version,
      });
      const updated = res.data.data.item;

      const nextItems = items.map((i) => (i.id === id ? updated : i));
      setItems(nextItems);
      setSummary(computeSummary(nextItems));
      setDrafts((prev) => ({ ...prev, [id]: { quantity: updated.quantity, threshold: updated.threshold } }));

      setSavedFlashId(id);
      setTimeout(() => setSavedFlashId((current) => (current === id ? null : current)), 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setRowErrors((prev) => ({ ...prev, [id]: 'This item changed elsewhere - refreshing latest values.' }));
        load();
      } else {
        const details = err.response?.data?.details;
        setRowErrors((prev) => ({
          ...prev,
          [id]: (details && details[0]?.message) || err.response?.data?.message || 'Could not save changes.',
        }));
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <DashboardLayout title="Inventory Management" badge="Admin">
      {error && <ErrorState message={error} onRetry={load} />}

      {!error && items === null && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-crust-100 bg-white" />
          ))}
        </div>
      )}

      {!error && items !== null && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Total items" value={summary.total} tone="default" />
            <SummaryCard label="Low stock" value={summary.lowStock} tone="warning" />
            <SummaryCard label="Out of stock" value={summary.outOfStock} tone="danger" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-crust-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <FilterPills options={CATEGORY_TABS} value={categoryFilter} onChange={setCategoryFilter} />
            <FilterPills options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          </div>

          {items.length === 0 && (
            <EmptyState
              icon="📦"
              title="No inventory records yet"
              message="Run the catalogue and inventory seed scripts on the server to populate stock data."
            />
          )}

          {items.length > 0 && sections.length === 0 && (
            <EmptyState icon="🔍" title="No items match your filters" message="Try a different category or status filter." />
          )}

          {sections.map((section) => (
            <div key={section.category} className="rounded-2xl border border-crust-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">{section.label}</h2>
              <div className="mt-2">
                {section.items.map((item) => (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    draft={drafts[item.id]}
                    onDraftChange={(field, value) =>
                      setDrafts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], [field]: value } }))
                    }
                    onSave={() => handleSave(item.id)}
                    isSaving={savingId === item.id}
                    rowError={rowErrors[item.id]}
                    justSaved={savedFlashId === item.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
