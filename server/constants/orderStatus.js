// Single source of truth for the order fulfillment lifecycle. The Order
// model's enum, admin validators and the status-transition service all
// import from here so the three lifecycle stages can never drift apart.
export const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

// Strictly sequential, forward-only state machine: each status maps to the
// one status it may advance to next, or null once no further progression
// is allowed. There is deliberately no admin override to skip a stage.
export const ORDER_STATUS_TRANSITIONS = {
  'Order Received': 'In Kitchen',
  'In Kitchen': 'Sent to Delivery',
  'Sent to Delivery': null,
};
