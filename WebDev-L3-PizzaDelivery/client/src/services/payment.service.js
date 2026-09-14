import api from './api';

export function createRazorpayOrder(orderId) {
  return api.post('/payments/create-order', { orderId });
}

export function verifyPayment(payload) {
  return api.post('/payments/verify', payload);
}
