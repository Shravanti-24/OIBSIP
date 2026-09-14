import api from './api';

export function validateCustomPizza({ baseId, sauceId, cheeseId, vegetableIds }) {
  return api.post('/builder/validate', { baseId, sauceId, cheeseId, vegetableIds });
}
