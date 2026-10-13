export default function TextField({ label, id, error, className = '', ...props }) {
  return (
    <div className={`text-left ${className}`}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-900">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={`w-full rounded-lg border px-3 py-2.5 text-ink-900 outline-none transition-colors focus:ring-2 focus:ring-tomato-500 ${
          error ? 'border-red-400' : 'border-crust-100 focus:border-tomato-500'
        }`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
