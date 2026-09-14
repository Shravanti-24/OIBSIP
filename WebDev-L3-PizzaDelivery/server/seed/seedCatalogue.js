import { connectDB, disconnectDB } from '../config/db.js';
import Ingredient from '../models/Ingredient.js';
import Pizza from '../models/Pizza.js';

/**
 * Idempotent catalogue bootstrap. Run with `npm run seed:catalogue`.
 * Upserts ingredients and ready-made pizzas by their stable `slug`, so
 * running this script repeatedly updates existing records instead of
 * creating duplicates.
 */

// All prices are whole Indian Rupees - the application's authoritative
// currency unit. Razorpay amounts are derived from these via toPaise().
const BASES = [
  { name: 'Classic Crust', slug: 'classic-crust', price: 149, displayOrder: 1 },
  { name: 'Thin Crust', slug: 'thin-crust', price: 129, displayOrder: 2 },
  { name: 'Cheese Burst', slug: 'cheese-burst', price: 199, displayOrder: 3 },
  { name: 'Whole Wheat', slug: 'whole-wheat', price: 159, displayOrder: 4 },
  { name: 'Pan Crust', slug: 'pan-crust', price: 169, displayOrder: 5 },
];

const SAUCES = [
  { name: 'Classic Tomato', slug: 'classic-tomato', price: 20, displayOrder: 1 },
  { name: 'Spicy Arrabbiata', slug: 'spicy-arrabbiata', price: 25, displayOrder: 2 },
  { name: 'Garlic Herb', slug: 'garlic-herb', price: 25, displayOrder: 3 },
  { name: 'Pesto', slug: 'pesto', price: 40, displayOrder: 4 },
  { name: 'BBQ', slug: 'bbq', price: 35, displayOrder: 5 },
];

const CHEESES = [
  { name: 'Mozzarella', slug: 'mozzarella', price: 50, displayOrder: 1 },
  { name: 'Cheddar', slug: 'cheddar', price: 60, displayOrder: 2 },
  { name: 'Parmesan', slug: 'parmesan', price: 75, displayOrder: 3 },
];

const VEGETABLES = [
  { name: 'Onion', slug: 'onion', price: 15, displayOrder: 1 },
  { name: 'Capsicum', slug: 'capsicum', price: 15, displayOrder: 2 },
  { name: 'Tomato', slug: 'tomato', price: 15, displayOrder: 3 },
  { name: 'Jalapeno', slug: 'jalapeno', price: 20, displayOrder: 4 },
  { name: 'Mushroom', slug: 'mushroom', price: 25, displayOrder: 5 },
  { name: 'Sweet Corn', slug: 'sweet-corn', price: 20, displayOrder: 6 },
];

const INGREDIENTS = [
  ...BASES.map((item) => ({ ...item, category: 'base' })),
  ...SAUCES.map((item) => ({ ...item, category: 'sauce' })),
  ...CHEESES.map((item) => ({ ...item, category: 'cheese' })),
  ...VEGETABLES.map((item) => ({ ...item, category: 'vegetable' })),
];

const PIZZA_IMAGE = {
  margherita: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=60',
  farmhouse: 'https://images.unsplash.com/photo-1600628421066-f6bda6a7b976?auto=format&fit=crop&w=800&q=60',
  'spicy-veggie': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=60',
  'bbq-veggie': 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=800&q=60',
  'pesto-garden': 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=60',
  'four-cheese': 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=60',
};

const PIZZAS = [
  {
    name: 'Margherita',
    slug: 'margherita',
    description: 'The timeless classic - vine tomatoes, fresh mozzarella and basil on our Classic Crust.',
    base: 'classic-crust',
    sauce: 'classic-tomato',
    cheese: 'mozzarella',
    vegetables: ['tomato'],
    price: 249,
    displayOrder: 1,
  },
  {
    name: 'Farmhouse',
    slug: 'farmhouse',
    description: 'A garden harvest of onion, capsicum, mushroom and sweet corn over melted cheddar.',
    base: 'pan-crust',
    sauce: 'classic-tomato',
    cheese: 'cheddar',
    vegetables: ['onion', 'capsicum', 'mushroom', 'sweet-corn'],
    price: 349,
    displayOrder: 2,
  },
  {
    name: 'Spicy Veggie',
    slug: 'spicy-veggie',
    description: 'A fiery arrabbiata base loaded with onion, capsicum and jalapeno on a light thin crust.',
    base: 'thin-crust',
    sauce: 'spicy-arrabbiata',
    cheese: 'mozzarella',
    vegetables: ['onion', 'capsicum', 'jalapeno'],
    price: 299,
    displayOrder: 3,
  },
  {
    name: 'BBQ Veggie',
    slug: 'bbq-veggie',
    description: 'Smoky BBQ sauce, cheddar, onion, capsicum and sweet corn on a hearty pan crust.',
    base: 'pan-crust',
    sauce: 'bbq',
    cheese: 'cheddar',
    vegetables: ['onion', 'capsicum', 'sweet-corn'],
    price: 329,
    displayOrder: 4,
  },
  {
    name: 'Pesto Garden',
    slug: 'pesto-garden',
    description: 'Fragrant basil pesto with parmesan, tomato, mushroom and onion on whole wheat crust.',
    base: 'whole-wheat',
    sauce: 'pesto',
    cheese: 'parmesan',
    vegetables: ['tomato', 'mushroom', 'onion'],
    price: 379,
    displayOrder: 5,
  },
  {
    name: 'Four Cheese',
    slug: 'four-cheese',
    description: 'An indulgent cheese-lover blend finished with parmesan on our signature cheese burst base.',
    base: 'cheese-burst',
    sauce: 'classic-tomato',
    cheese: 'parmesan',
    vegetables: [],
    price: 399,
    displayOrder: 6,
  },
];

async function upsertIngredients() {
  const bySlug = new Map();

  for (const item of INGREDIENTS) {
    const doc = await Ingredient.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    bySlug.set(item.slug, doc);
  }

  return bySlug;
}

async function upsertPizzas(ingredientsBySlug) {
  for (const pizza of PIZZAS) {
    const base = ingredientsBySlug.get(pizza.base);
    const sauce = ingredientsBySlug.get(pizza.sauce);
    const cheese = ingredientsBySlug.get(pizza.cheese);
    const vegetables = pizza.vegetables.map((slug) => ingredientsBySlug.get(slug)?._id).filter(Boolean);

    await Pizza.findOneAndUpdate(
      { slug: pizza.slug },
      {
        $set: {
          name: pizza.name,
          slug: pizza.slug,
          description: pizza.description,
          image: PIZZA_IMAGE[pizza.slug] || '',
          base: base._id,
          sauce: sauce._id,
          cheese: cheese._id,
          vegetables,
          price: pizza.price,
          isActive: true,
          displayOrder: pizza.displayOrder,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
}

async function seedCatalogue() {
  await connectDB();

  const ingredientsBySlug = await upsertIngredients();
  console.log(`[seed:catalogue] Upserted ${ingredientsBySlug.size} ingredients.`);

  await upsertPizzas(ingredientsBySlug);
  console.log(`[seed:catalogue] Upserted ${PIZZAS.length} pizza varieties.`);

  await disconnectDB();
}

seedCatalogue().catch((error) => {
  console.error('[seed:catalogue] Failed:', error);
  process.exitCode = 1;
});
