import { body, param } from 'express-validator';
import mongoose from 'mongoose';

export const inventoryIdParamValidator = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('A valid inventory id is required'),
];

export const inventoryUpdateValidators = [
  ...inventoryIdParamValidator,
  body('quantity')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Quantity must be a whole number between 0 and 100000')
    .toInt(),
  body('threshold')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Threshold must be a whole number between 0 and 100000')
    .toInt(),
  body('version').optional().isInt({ min: 0 }).withMessage('Invalid version').toInt(),
  body().custom((value) => {
    if (value.quantity === undefined && value.threshold === undefined) {
      throw new Error('Provide quantity and/or threshold to update');
    }
    return true;
  }),
];
