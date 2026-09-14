import { useState } from 'react';

function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

export default function PizzaCard({ pizza, onSelect }) {
  const [imgFailed, setImgFailed] = useState(false);
  const tags = [pizza.base?.name, pizza.sauce?.name, pizza.cheese?.name, ...(pizza.vegetables || []).map((v) => v.name)]
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-crust-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden bg-crust-100">
        {!imgFailed && pizza.image ? (
          <img
            src={pizza.image}
            alt={pizza.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl" aria-hidden="true">
            🍕
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink-900">{pizza.name}</h3>
          <span className="whitespace-nowrap text-lg font-semibold text-tomato-500">{formatPrice(pizza.price)}</span>
        </div>
        {pizza.description && <p className="line-clamp-2 text-sm text-ink-900/70">{pizza.description}</p>}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-crust-50 px-2.5 py-1 text-xs text-ink-900/70">
                {tag}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => onSelect(pizza)}
          className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-tomato-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-tomato-600 focus:outline-none focus:ring-2 focus:ring-tomato-500 focus:ring-offset-2"
        >
          Select this pizza
        </button>
      </div>
    </div>
  );
}
