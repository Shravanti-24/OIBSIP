import Button from './Button';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
      <span className="text-3xl" aria-hidden="true">
        ⚠️
      </span>
      <p className="max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="ghost" className="w-auto px-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
