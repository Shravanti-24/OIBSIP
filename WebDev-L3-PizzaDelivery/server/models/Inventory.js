import mongoose from 'mongoose';

const { Schema } = mongoose;

export const STOCK_STATUS = {
  OUT_OF_STOCK: 'out-of-stock',
  LOW_STOCK: 'low-stock',
  IN_STOCK: 'in-stock',
};

/**
 * Single source of truth for stock status. The dashboard, the admin API and
 * the future low-stock automation must all agree on this definition, so it
 * lives here rather than being re-derived in the frontend.
 */
export function deriveStockStatus(quantity, threshold) {
  if (quantity <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (quantity < threshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

const inventorySchema = new Schema(
  {
    // The Ingredient document remains the canonical catalogue definition
    // (name, category, price); Inventory only tracks its physical stock.
    ingredient: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient is required'],
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    threshold: {
      type: Number,
      required: true,
      min: [0, 'Threshold cannot be negative'],
      default: 10,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: 'portion',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
