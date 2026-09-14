import mongoose from 'mongoose';

const { Schema } = mongoose;

// A frozen snapshot of an ingredient at purchase time - never re-derived
// from the live Ingredient document, since catalogue prices can change
// after an order is placed.
const ingredientSnapshotSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Ingredient' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    type: { type: String, enum: ['ready-made', 'custom'], required: true },
    name: { type: String, required: true, trim: true },
    pizza: { type: Schema.Types.ObjectId, ref: 'Pizza' },
    base: ingredientSnapshotSchema,
    sauce: ingredientSnapshotSchema,
    cheese: ingredientSnapshotSchema,
    vegetables: { type: [ingredientSnapshotSchema], default: [] },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    unitPrice: { type: Number, required: true, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    currency: { type: String, default: 'INR', enum: ['INR'] },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    // Unset until payment is verified - a pending order has no order
    // lifecycle status yet, so it must not read as "Order Received".
    orderStatus: {
      type: String,
      enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'],
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null, select: false },
    // Set exactly once, by the inventory service, after a verified payment
    // successfully deducts stock. This is the idempotency guard that stops
    // a duplicate payment-verification request from consuming stock twice.
    inventoryDeducted: { type: Boolean, default: false },
    inventoryDeductedAt: { type: Date, default: null },
    // Distinct from paymentStatus: a payment can be captured by Razorpay
    // (paid) while fulfillment is blocked because an ingredient ran out of
    // stock between checkout and verification. 'confirmed' only when
    // inventory was successfully deducted for this order.
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'blocked'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.razorpaySignature;
        return ret;
      },
    },
  },
);

orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
