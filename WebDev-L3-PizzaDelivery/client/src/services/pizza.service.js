import api from './api';

export function fetchPizzas() {
  return api.get('/pizzas');
}
