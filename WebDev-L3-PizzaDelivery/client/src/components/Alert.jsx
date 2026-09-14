const STYLES = {
  success: 'bg-basil-500/10 text-basil-600 border border-basil-500/30',
  error: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-crust-100 text-ink-900 border border-crust-500/30',
};

export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${STYLES[type]}`}>
      {children}
    </div>
  );
}
