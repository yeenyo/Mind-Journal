import { useEffect, useId, useRef } from 'react';

// Label sits above the input (never a placeholder-as-label — it disappears the
// moment you start typing, which is exactly when you need it).
export default function Field({
  label,
  hint,
  error,
  className = '',
  as = 'input',
  rows,
  ...inputProps
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const Control = as === 'textarea' ? 'textarea' : 'input';
  const wrapperRef = useRef(null);

  // The shake is restarted imperatively rather than by remounting with a key:
  // remounting would blow away the input's focus and cursor position mid-typing,
  // which is a far worse experience than no animation. Removing the class,
  // forcing a reflow, and re-adding it is the standard way to replay a CSS
  // animation on an element that has to stay put.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!error || !node) return;
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  }, [error]);

  const controlClasses = [
    'w-full rounded-lg border bg-white px-3.5 py-3 text-gray-900 transition-colors',
    'placeholder:text-gray-400',
    // 48px minimum touch height on mobile.
    as === 'textarea' ? 'min-h-32 resize-y leading-relaxed' : 'min-h-12',
    error
      ? 'border-red-400 bg-red-50/40 focus:border-red-500'
      : 'border-gray-300 hover:border-gray-400 focus:border-brand-500',
  ].join(' ');

  return (
    <div ref={wrapperRef} className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {inputProps.required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <Control
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
        }
        className={controlClasses}
        {...inputProps}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="fade-in flex items-start gap-1.5 text-xs font-medium text-red-600">
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
