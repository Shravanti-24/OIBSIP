/**
 * Centralized rupee/paise conversion so this math is never duplicated (and
 * never done carelessly with floats) across controllers/services.
 *
 * The application stores and displays money in whole rupees. Razorpay's API
 * requires amounts in the smallest currency subunit (paise for INR).
 */
export function toPaise(rupees) {
  if (typeof rupees !== 'number' || !Number.isFinite(rupees) || rupees < 0) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(rupees * 100);
}

export function round2(amount) {
  return Math.round(amount * 100) / 100;
}
