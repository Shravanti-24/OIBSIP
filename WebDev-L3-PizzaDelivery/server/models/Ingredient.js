import mongoose from 'mongoose';

const { Schema } = mongoose;

export const INGREDIENT_CATEGORIES = ['base', 'sauce', 'cheese', 'vegetable'];

const ingredientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name is too long'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: INGREDIENT_CATEGORIES,
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
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

ingredientSchema.index({ category: 1, displayOrder: 1, name: 1 });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

export default Ingredient;
