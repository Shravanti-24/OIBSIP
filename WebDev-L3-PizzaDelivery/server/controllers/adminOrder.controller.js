import * as adminOrderService from '../services/adminOrder.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/admin/orders?status=&page=&limit=
export const listAdminOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await adminOrderService.listOrders({ status, page, limit });
  res.status(200).json({ success: true, data: result });
});

// GET /api/admin/orders/:id
export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await adminOrderService.getOrderById(req.params.id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  res.status(200).json({ success: true, data: { order } });
});

// PATCH /api/admin/orders/:id/status
export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await adminOrderService.updateOrderStatus(req.params.id, status, req.user.id);
  res.status(200).json({ success: true, message: `Order status updated to "${status}"`, data: { order } });
});
