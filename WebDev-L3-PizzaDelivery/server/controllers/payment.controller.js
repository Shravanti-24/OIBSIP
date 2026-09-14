import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { createRazorpayOrderForAmount, verifyPaymentSignature } from '../services/payment.service.js';
import * as inventoryService from '../services/inventory.service.js';
import { env } from '../config/env.js';
import { toPaise } from '../utils/money.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function loadOwnedOrder(req) {
  const { orderId } = req.body;
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    throw ApiError.badRequest('A valid orderId is required');
  }
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return order;
}

// POST /api/payments/create-order
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const order = await loadOwnedOrder(req);

  if (order.paymentStatus === 'paid') {
    throw ApiError.badRequest('This order has already been paid');
  }

  // Reuse an already-created Razorpay order on retry (e.g. the user
  // dismissed checkout and clicked pay again) instead of minting a new one
  // for every click.
  if (!order.razorpayOrderId) {
    const razorpayOrder = await createRazorpayOrderForAmount({
      amountInRupees: order.totalAmount,
      receipt: order._id.toString(),
    });
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = 'pending';
    await order.save();
  }

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: toPaise(order.totalAmount),
      currency: order.currency,
      keyId: env.razorpayKeyId,
    },
  });
});

// POST /api/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: signature,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !signature) {
    throw ApiError.badRequest('Missing payment verification fields');
  }

  const order = await loadOwnedOrder(req);

  // Idempotency: a duplicate submission of the same already-verified
  // payment returns the existing confirmed order rather than re-verifying
  // or creating anything new.
  if (order.paymentStatus === 'paid') {
    if (order.razorpayPaymentId === razorpayPaymentId) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: { order },
      });
    }
    throw ApiError.conflict('This order has already been paid');
  }

  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
    throw ApiError.badRequest('Razorpay order does not match this order');
  }

  const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature });
  if (!isValid) {
    order.paymentStatus = 'failed';
    await order.save();
    // eslint-disable-next-line no-console
    console.warn(`[payment] Signature verification failed for order ${order._id}`);
    throw ApiError.badRequest('Payment verification failed');
  }

  // Atomically flip pending -> paid so a duplicate/concurrent verification
  // request for this same order can never win this race twice. Only the
  // request that actually performs this transition goes on to deduct
  // inventory; a request that loses the race falls through to the
  // "already verified" response below.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        paymentStatus: 'paid',
        razorpayPaymentId,
        razorpaySignature: signature,
      },
    },
    { returnDocument: 'after' },
  );

  if (!claimed) {
    const existing = await Order.findById(order._id);
    return res.status(200).json({
      success: true,
      message: 'Payment already verified',
      data: { order: existing },
    });
  }

  // Stock is only ever consumed here, after payment has been verified -
  // never at order creation, checkout start, or a failed/cancelled payment.
  try {
    await inventoryService.consumeForOrder(claimed);
    claimed.inventoryDeducted = true;
    claimed.inventoryDeductedAt = new Date();
    claimed.fulfillmentStatus = 'confirmed';
    claimed.orderStatus = 'Order Received';
    await claimed.save();
  } catch (error) {
    // The payment was genuinely captured by Razorpay, so paymentStatus
    // stays 'paid' - it would be dishonest to call this a failed payment.
    // Fulfillment is what failed: record that distinctly rather than
    // falsely marking the order as normally received into the kitchen.
    claimed.fulfillmentStatus = 'blocked';
    await claimed.save();
    // eslint-disable-next-line no-console
    console.error(`[inventory] Order ${claimed._id} paid but could not be fulfilled:`, error.message);

    return res.status(200).json({
      success: true,
      message:
        'Payment was successful, but one or more items in your order are currently unavailable. Our team will reach out to resolve this.',
      data: { order: claimed },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: { order: claimed },
  });
});
