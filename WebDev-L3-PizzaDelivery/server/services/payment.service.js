import crypto from 'crypto';
import { razorpay, isRazorpayConfigured } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { toPaise } from '../utils/money.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Creates a Razorpay order for an already-authoritative rupee amount.
 * Callers must never pass a client-supplied amount here.
 */
export async function createRazorpayOrderForAmount({ amountInRupees, receipt }) {
  if (!isRazorpayConfigured) {
    throw new ApiError(503, 'Payment processing is not configured yet. Please try again later.');
  }

  try {
    return await razorpay.orders.create({
      amount: toPaise(amountInRupees),
      currency: 'INR',
      receipt,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[razorpay] Order creation failed:', error.message);
    throw new ApiError(502, 'We could not start the payment process. Please try again.');
  }
}

/**
 * Verifies the HMAC SHA256 signature Razorpay returns after a successful
 * checkout. This is the mandatory server-side proof that the payment
 * response actually came from Razorpay - it is never sufficient to trust
 * the frontend's checkout success callback alone.
 */
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  signature,
  secret = env.razorpayKeySecret,
}) {
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    // Different lengths etc. - definitely not a match.
    return false;
  }
}
