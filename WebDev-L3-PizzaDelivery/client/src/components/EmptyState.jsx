export default function EmptyState({ icon = '🍕', title, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-crust-100 bg-white/60 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="font-medium text-ink-900">{title}</p>
      {message && <p className="max-w-sm text-sm text-ink-900/60">{message}</p>}
    </div>
  );
}
