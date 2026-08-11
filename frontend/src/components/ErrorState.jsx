import Button from './Button';
import Card from './Card';

// A failed load is not the same as a validation error: the user did nothing
// wrong and the only useful affordance is retrying. Never render a bare
// "something went wrong" — `message` should be the actual reason.
export default function ErrorState({ title = 'That didn’t load', message, onRetry, retrying = false }) {
  return (
    <Card tone="danger" className="text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 9v4m0 4h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <p className="font-medium text-gray-900">{title}</p>
      {message && <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-600">{message}</p>}
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry} loading={retrying} loadingText="Retrying…">
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
