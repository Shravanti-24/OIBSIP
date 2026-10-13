import api from './api';

export function createOrder(payload) {
  return api.post('/orders', payload);
}

export function fetchOrders() {
  return api.get('/orders');
}

export function fetchOrderById(id) {
  return api.get(`/orders/${id}`);
}
