import api from './api';

export function fetchIngredients(category) {
  return api.get('/ingredients', { params: category ? { category } : undefined });
}
