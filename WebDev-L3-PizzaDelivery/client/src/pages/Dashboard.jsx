import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PizzaCard from '../components/PizzaCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import * as pizzaService from '../services/pizza.service';
import { saveOrderDraft } from '../utils/orderDraft';

function PizzaCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-crust-100 bg-white">
      <div className="aspect-[4/3] w-full bg-crust-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-crust-100" />
        <div className="h-3 w-full rounded bg-crust-100" />
        <div className="h-3 w-1/2 rounded bg-crust-100" />
        <div className="h-9 w-full rounded-lg bg-crust-100" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pizzas, setPizzas] = useState(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    setPizzas(null);
    pizzaService
      .fetchPizzas()
      .then((res) => setPizzas(res.data.data.pizzas))
      .catch(() => setError('We could not load the pizza menu. Please try again.'));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSelectPizza(pizza) {
    saveOrderDraft({
      type: 'ready-made',
      pizza: {
        id: pizza._id,
        name: pizza.name,
        description: pizza.description,
        image: pizza.image,
        price: pizza.price,
      },
      price: pizza.price,
    });
    navigate('/order-review');
  }

  return (
    <DashboardLayout title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}!`}>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-crust-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Craving something specific?</h2>
          <p className="mt-1 text-sm text-ink-900/60">
            Build your own pizza from scratch - pick your base, sauce, cheese and toppings.
          </p>
        </div>
        <Link to="/customize">
          <Button className="w-auto px-6">Build your own pizza</Button>
        </Link>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-ink-900">Our pizza varieties</h2>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && pizzas === null && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <PizzaCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && pizzas !== null && pizzas.length === 0 && (
        <EmptyState
          title="No pizzas available right now"
          message="Please check back soon, or build your own pizza instead."
        />
      )}

      {!error && pizzas !== null && pizzas.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pizzas.map((pizza) => (
            <PizzaCard key={pizza._id} pizza={pizza} onSelect={handleSelectPizza} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
