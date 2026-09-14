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
