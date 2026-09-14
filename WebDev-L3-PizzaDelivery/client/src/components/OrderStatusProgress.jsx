import { ORDER_STATUSES } from '../utils/orderStatus';

/**
 * Visual lifecycle tracker: shown states are completed / current / upcoming
 * relative to `status`. Used on both the user's order detail page and the
 * admin order detail page so the two always agree on what "current" means.
 */
export default function OrderStatusProgress({ status }) {
  const currentIndex = ORDER_STATUSES.indexOf(status);

  return (
    <ol className="space-y-0">
      {ORDER_STATUSES.map((stage, index) => {
        const isComplete = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === ORDER_STATUSES.length - 1;

        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isComplete
                    ? 'bg-basil-500 text-white'
                    : isCurrent
                      ? 'bg-tomato-500 text-white'
                      : 'bg-crust-100 text-ink-900/40'
                }`}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              {!isLast && <span className={`mt-1 h-8 w-0.5 ${isComplete ? 'bg-basil-500' : 'bg-crust-100'}`} />}
            </div>
            <div className={isLast ? '' : 'pb-8'}>
              <p
                className={`text-sm font-medium ${
                  isComplete || isCurrent ? 'text-ink-900' : 'text-ink-900/40'
                }`}
              >
                {stage}
              </p>
              {isCurrent && <p className="text-xs text-tomato-500">Current status</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
