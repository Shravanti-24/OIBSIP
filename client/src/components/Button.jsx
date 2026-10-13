export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-tomato-500 text-white hover:bg-tomato-600 focus:ring-tomato-500',
    admin: 'bg-ink-900 text-white hover:bg-black focus:ring-ink-900',
    ghost: 'bg-transparent text-ink-900 hover:bg-crust-100 focus:ring-crust-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
