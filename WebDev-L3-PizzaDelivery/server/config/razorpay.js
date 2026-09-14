import Razorpay from 'razorpay';
import { env } from './env.js';

export const isRazorpayConfigured = Boolean(env.razorpayKeyId && env.razorpayKeySecret);

if (!isRazorpayConfigured) {
  // eslint-disable-next-line no-console
  console.warn('[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set. Payment endpoints will return 503.');
}

export const razorpay = isRazorpayConfigured
  ? new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
  : null;
