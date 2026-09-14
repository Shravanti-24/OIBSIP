export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-900">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-crust-100 border-t-tomato-500" />
      <p className="text-sm text-ink-900/70">{label}</p>
    </div>
  );
}
