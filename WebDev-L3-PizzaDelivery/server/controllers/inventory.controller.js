import * as inventoryService from '../services/inventory.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/admin/inventory?category=&status=
export const listInventory = asyncHandler(async (req, res) => {
  const { category, status } = req.query;
  const result = await inventoryService.listInventory({ category, status });
  res.status(200).json({ success: true, data: result });
});

// GET /api/admin/inventory/:id
export const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  if (!item) {
    throw ApiError.notFound('Inventory item not found');
  }
  res.status(200).json({ success: true, data: { item } });
});

// PATCH /api/admin/inventory/:id
export const updateInventory = asyncHandler(async (req, res) => {
  const { quantity, threshold, version } = req.body;
  const item = await inventoryService.updateInventory(req.params.id, { quantity, threshold, version });
  res.status(200).json({ success: true, message: 'Inventory updated', data: { item } });
});
