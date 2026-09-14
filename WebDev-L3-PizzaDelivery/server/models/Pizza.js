import mongoose from 'mongoose';

const { Schema } = mongoose;

const pizzaSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name is too long'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description is too long'],
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    base: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'A base is required'],
    },
    sauce: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'A sauce is required'],
    },
    cheese: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'A cheese is required'],
    },
    vegetables: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
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

pizzaSchema.index({ isActive: 1, displayOrder: 1, name: 1 });

const Pizza = mongoose.model('Pizza', pizzaSchema);

export default Pizza;
