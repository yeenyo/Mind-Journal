import { useEffect, useState } from 'react';

// Brief green checkmark confirmation. Auto-dismisses so it never becomes
// another thing on screen to deal with.
export default function SuccessFlash({ message, duration = 2400, onDone }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return undefined;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDone]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flash-in flex items-center gap-2.5 rounded-lg border border-accent-200 bg-accent-50 p-3.5 text-sm font-medium text-accent-700"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {message}
    </div>
  );
}
