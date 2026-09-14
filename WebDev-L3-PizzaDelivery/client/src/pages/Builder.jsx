import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import IngredientOption from '../components/IngredientOption';
import PizzaSummary from '../components/PizzaSummary';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Alert from '../components/Alert';
import * as ingredientService from '../services/ingredient.service';
import * as builderService from '../services/builder.service';
import { saveOrderDraft } from '../utils/orderDraft';

const STEPS = [
  { category: 'base', step: 1, title: 'Choose your base', hint: 'Pick exactly one' },
  { category: 'sauce', step: 2, title: 'Choose your sauce', hint: 'Pick exactly one' },
  { category: 'cheese', step: 3, title: 'Choose your cheese', hint: 'Pick exactly one' },
  { category: 'vegetable', step: 4, title: 'Add your vegetables', hint: 'Pick as many as you like' },
];

function round2(amount) {
  return Math.round(amount * 100) / 100;
}

export default function Builder() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [baseId, setBaseId] = useState(null);
  const [sauceId, setSauceId] = useState(null);
  const [cheeseId, setCheeseId] = useState(null);
  const [vegetableIds, setVegetableIds] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    setLoadError('');
    setIngredients(null);
    ingredientService
      .fetchIngredients()
      .then((res) => {
        const grouped = { base: [], sauce: [], cheese: [], vegetable: [] };
        for (const item of res.data.data.ingredients) {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        }
        setIngredients(grouped);
      })
      .catch(() => setLoadError('We could not load pizza ingredients. Please try again.'));
  }

  useEffect(() => {
    load();
  }, []);

  const byId = useMemo(() => {
    const map = new Map();
    if (ingredients) {
      for (const list of Object.values(ingredients)) {
        for (const item of list) map.set(item._id, item);
      }
    }
    return map;
  }, [ingredients]);

  const base = baseId ? byId.get(baseId) : null;
  const sauce = sauceId ? byId.get(sauceId) : null;
  const cheese = cheeseId ? byId.get(cheeseId) : null;
  const vegetables = vegetableIds.map((id) => byId.get(id)).filter(Boolean);

  const price = useMemo(
    () =>
      round2(
        Number(base?.price || 0) + Number(sauce?.price || 0) + Number(cheese?.price || 0) +
          vegetables.reduce((sum, veg) => sum + Number(veg.price), 0),
      ),
    [base, sauce, cheese, vegetables],
  );

  const canContinue = Boolean(baseId && sauceId && cheeseId) && !isSubmitting;

  function toggleVegetable(ingredient) {
    setVegetableIds((prev) =>
      prev.includes(ingredient._id) ? prev.filter((id) => id !== ingredient._id) : [...prev, ingredient._id],
    );
  }

  function selectionFor(category, item) {
    if (category === 'base') setBaseId(item._id);
    else if (category === 'sauce') setSauceId(item._id);
    else if (category === 'cheese') setCheeseId(item._id);
    else toggleVegetable(item);
  }

  function isSelected(category, item) {
    if (category === 'base') return baseId === item._id;
    if (category === 'sauce') return sauceId === item._id;
    if (category === 'cheese') return cheeseId === item._id;
    return vegetableIds.includes(item._id);
  }

  async function handleContinue() {
    setSubmitError('');
    if (!baseId || !sauceId || !cheeseId) {
      setSubmitError('Please choose a base, sauce and cheese before continuing.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await builderService.validateCustomPizza({ baseId, sauceId, cheeseId, vegetableIds });
      const { selection } = res.data.data;
      saveOrderDraft({
        type: 'custom',
        base: selection.base,
        sauce: selection.sauce,
        cheese: selection.cheese,
        vegetables: selection.vegetables,
        price: selection.price,
      });
      navigate('/order-review');
    } catch (err) {
      const details = err.response?.data?.details;
      const message =
        (details && details[0]?.message) ||
        err.response?.data?.message ||
        'We could not validate your pizza. Please review your selections and try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Customize your pizza">
      {loadError && <ErrorState message={loadError} onRetry={load} />}

      {!loadError && !ingredients && <Spinner label="Loading ingredients..." />}

      {!loadError && ingredients && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-8">
            {STEPS.map(({ category, step, title, hint }) => (
              <section key={category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-tomato-500">Step {step}</p>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                  <span className="text-xs text-ink-900/50">{hint}</span>
                </div>
                {ingredients[category].length === 0 ? (
                  <p className="text-sm text-ink-900/50">No options currently available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ingredients[category].map((item) => (
                      <IngredientOption
                        key={item._id}
                        ingredient={item}
                        selected={isSelected(category, item)}
                        multi={category === 'vegetable'}
                        onToggle={() => selectionFor(category, item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}

            {submitError && <Alert type="error">{submitError}</Alert>}
          </div>

          <PizzaSummary
            base={base}
            sauce={sauce}
            cheese={cheese}
            vegetables={vegetables}
            price={price}
            onContinue={handleContinue}
            canContinue={canContinue}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
