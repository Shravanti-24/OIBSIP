const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * The single place the app formats rupee amounts for display, so every
 * screen renders money the same way (₹ symbol, Indian digit grouping, no
 * decimals since the backend deals only in whole rupees).
 */
export function formatINR(amount) {
  return formatter.format(Number(amount) || 0);
}
