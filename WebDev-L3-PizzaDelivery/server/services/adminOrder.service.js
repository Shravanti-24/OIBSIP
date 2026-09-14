import Order from '../models/Order.js';
import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } from '../constants/orderStatus.js';
import { ApiError } from '../utils/ApiError.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function serializeAdminOrder(doc) {
  const { user: customer, ...order } = doc.toJSON();
  return {
    ...order,
    customer: customer ? { id: customer._id ?? customer.id, name: customer.name, email: customer.email } : null,
  };
}

/**
 * Admin order queue: only orders that have completed payment + inventory
 * confirmation (i.e. have an orderStatus) are "incoming orders" a kitchen
 * needs to act on - a still-pending-payment order isn't actionable yet.
 */
export async function listOrders({ status, page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(limit) || DEFAULT_PAGE_SIZE));

  const filter = status ? { orderStatus: status } : { orderStatus: { $in: ORDER_STATUSES } };

  const [docs, total, statusCounts] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { orderStatus: { $in: ORDER_STATUSES } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
  const summary = {
    total: ORDER_STATUSES.reduce((sum, key) => sum + (countByStatus[key] || 0), 0),
    orderReceived: countByStatus['Order Received'] || 0,
    inKitchen: countByStatus['In Kitchen'] || 0,
    sentToDelivery: countByStatus['Sent to Delivery'] || 0,
  };

  return {
    orders: docs.map(serializeAdminOrder),
    summary,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 },
  };
}

export async function getOrderById(id) {
  const doc = await Order.findById(id).populate('user', 'name email');
  if (!doc) return null;
  return serializeAdminOrder(doc);
}

/**
 * Enforces the sequential, admin-only fulfillment state machine. Never
 * touches paymentStatus, totalAmount, inventoryDeducted or Razorpay
 * identifiers - those belong exclusively to the payment/inventory flow.
 */
export async function updateOrderStatus(id, nextStatus, adminUserId) {
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw ApiError.badRequest(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (!order.orderStatus) {
    throw ApiError.badRequest('This order has not been confirmed yet and has no fulfillment status to update');
  }

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.orderStatus];
  if (allowedNext !== nextStatus) {
    throw ApiError.conflict(
      `Cannot move an order from "${order.orderStatus}" to "${nextStatus}". ` +
        (allowedNext ? `The only valid next status is "${allowedNext}".` : 'This order has already reached its final status.'),
    );
  }

  order.orderStatus = nextStatus;
  order.statusHistory.push({ status: nextStatus, changedAt: new Date(), changedBy: adminUserId });
  await order.save();

  return await getOrderById(order._id);
}
