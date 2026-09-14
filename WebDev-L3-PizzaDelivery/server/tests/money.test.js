import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { toPaise, round2 } from '../utils/money.js';
import { verifyPaymentSignature } from '../services/payment.service.js';

describe('toPaise', () => {
  it('converts whole rupees to paise', () => {
    expect(toPaise(299)).toBe(29900);
    expect(toPaise(1)).toBe(100);
    expect(toPaise(0)).toBe(0);
  });

  it('rounds fractional rupees safely rather than truncating', () => {
    expect(toPaise(499.5)).toBe(49950);
    expect(toPaise(10.005)).toBe(1001); // 1000.5 rounds to nearest paise
  });

  it('rejects invalid amounts', () => {
    expect(() => toPaise(-1)).toThrow();
    expect(() => toPaise(NaN)).toThrow();
    expect(() => toPaise('299')).toThrow();
  });
});

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
    expect(round2(149)).toBe(149);
  });
});

describe('verifyPaymentSignature', () => {
  const secret = 'test_secret_key';
  const razorpayOrderId = 'order_test123';
  const razorpayPaymentId = 'pay_test456';

  function signFor(orderId, paymentId, key) {
    return crypto.createHmac('sha256', key).update(`${orderId}|${paymentId}`).digest('hex');
  }

  it('accepts a correctly-signed payload', () => {
    const signature = signFor(razorpayOrderId, razorpayPaymentId, secret);
    expect(verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature, secret })).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const signature = signFor(razorpayOrderId, razorpayPaymentId, secret);
    const tampered = signature.replace(/.$/, signature.at(-1) === 'a' ? 'b' : 'a');
    expect(verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature: tampered, secret })).toBe(false);
  });

  it('rejects a signature produced with the wrong secret', () => {
    const signature = signFor(razorpayOrderId, razorpayPaymentId, 'wrong_secret');
    expect(verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature, secret })).toBe(false);
  });

  it('rejects when the order ID does not match what was signed', () => {
    const signature = signFor(razorpayOrderId, razorpayPaymentId, secret);
    expect(
      verifyPaymentSignature({ razorpayOrderId: 'order_different', razorpayPaymentId, signature, secret }),
    ).toBe(false);
  });

  it('rejects a signature of a different length without throwing', () => {
    expect(
      verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature: 'short', secret }),
    ).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    const signature = signFor(razorpayOrderId, razorpayPaymentId, secret);
    expect(
      verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature, secret: '' }),
    ).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature: '', secret })).toBe(false);
  });
});
