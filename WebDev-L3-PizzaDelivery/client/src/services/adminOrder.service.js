import api from './api';

export function fetchAdminOrders(params) {
  return api.get('/admin/orders', { params });
}

export function fetchAdminOrderById(id) {
  return api.get(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id, status) {
  return api.patch(`/admin/orders/${id}/status`, { status });
}
