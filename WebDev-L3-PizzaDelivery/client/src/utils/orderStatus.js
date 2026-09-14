// Mirrors server/constants/orderStatus.js. The frontend never enforces the
// transition rule itself (the backend is authoritative) - this is only used
// to render progress and to label the single legal "next" action.
export const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

export const NEXT_ORDER_STATUS = {
  'Order Received': 'In Kitchen',
  'In Kitchen': 'Sent to Delivery',
  'Sent to Delivery': null,
};
