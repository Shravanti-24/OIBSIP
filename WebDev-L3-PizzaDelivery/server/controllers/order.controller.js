import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { resolveOrderItems } from '../services/order.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const { items: resolvedItems, totalAmount } = await resolveOrderItems(items);

  const order = await Order.create({
    user: req.user.id,
    items: resolvedItems,
    currency: 'INR',
    totalAmount,
    paymentStatus: 'pending',
  });

  res.status(201).json({ success: true, data: { order } });
});

// GET /api/orders
export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { orders } });
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound('Order not found');
  }

  // Scoping the query to the requesting user (rather than checking
  // ownership after a plain findById) means a request for someone else's
  // order 404s exactly like a nonexistent one - it never confirms the ID
  // is valid but "not yours".
  const order = await Order.findOne({ _id: id, user: req.user.id });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  res.status(200).json({ success: true, data: { order } });
});
