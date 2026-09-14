const PAYMENT_STYLES = {
  paid: 'bg-basil-500/10 text-basil-600',
  pending: 'bg-crust-100 text-ink-900/70',
  failed: 'bg-red-50 text-red-700',
};

const ORDER_STATUS_STYLES = {
  'Order Received': 'bg-basil-500/10 text-basil-600',
  'In Kitchen': 'bg-crust-500/10 text-crust-600',
  'Sent to Delivery': 'bg-tomato-500/10 text-tomato-600',
};

const STOCK_STATUS_LABELS = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

const STOCK_STATUS_STYLES = {
  'in-stock': 'bg-basil-500/10 text-basil-600',
  'low-stock': 'bg-amber-100 text-amber-700',
  'out-of-stock': 'bg-red-50 text-red-700',
};

const STOCK_STATUS_ICONS = {
  'in-stock': '✓',
  'low-stock': '⚠',
  'out-of-stock': '✕',
};

function Badge({ className, children }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  return (
    <Badge className={`capitalize ${PAYMENT_STYLES[status] || 'bg-crust-100 text-ink-900/70'}`}>{status}</Badge>
  );
}

export function OrderStatusBadge({ status }) {
  if (!status) {
    return <Badge className="bg-crust-100 text-ink-900/50">Awaiting payment</Badge>;
  }
  return <Badge className={ORDER_STATUS_STYLES[status] || 'bg-crust-100 text-ink-900/70'}>{status}</Badge>;
}

export function StockStatusBadge({ status }) {
  return (
    <Badge className={STOCK_STATUS_STYLES[status] || 'bg-crust-100 text-ink-900/70'}>
      <span aria-hidden="true">{STOCK_STATUS_ICONS[status]}</span> {STOCK_STATUS_LABELS[status] || status}
    </Badge>
  );
}

export function FulfillmentStatusBadge({ status }) {
  if (status !== 'blocked') return null;
  return <Badge className="bg-red-50 text-red-700">⚠ Stock issue</Badge>;
}
