import api from './api';

export function fetchInventory() {
  return api.get('/admin/inventory');
}

export function fetchInventoryItem(id) {
  return api.get(`/admin/inventory/${id}`);
}

export function updateInventoryItem(id, payload) {
  return api.patch(`/admin/inventory/${id}`, payload);
}
