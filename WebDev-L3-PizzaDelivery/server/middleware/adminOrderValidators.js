import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';
import { ORDER_STATUSES } from '../constants/orderStatus.js';

export const adminOrderIdParamValidator = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('A valid order id is required'),
];

export const adminOrderListValidators = [
  query('status').optional().isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

export const adminOrderStatusUpdateValidators = [
  ...adminOrderIdParamValidator,
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(ORDER_STATUSES)
    .withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];
