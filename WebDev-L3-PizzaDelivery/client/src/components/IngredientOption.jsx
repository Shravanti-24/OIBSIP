export default function IngredientOption({ ingredient, selected, onToggle, multi = false }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(ingredient)}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-tomato-500 focus:ring-offset-1 ${
        selected ? 'border-tomato-500 bg-tomato-500/5' : 'border-crust-100 bg-white hover:border-crust-500'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-medium text-ink-900">{ingredient.name}</span>
        {selected && (
          <span aria-hidden="true" className="text-tomato-500">
            {multi ? '✓' : '●'}
          </span>
        )}
      </span>
      <span className="text-xs text-ink-900/50">+${Number(ingredient.price).toFixed(2)}</span>
    </button>
  );
}
