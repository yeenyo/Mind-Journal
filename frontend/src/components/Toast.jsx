import { useEffect, useState } from 'react';
import { CheckIcon } from './Icons';

const TONES = {
  success: 'border-accent-200 bg-accent-50 text-accent-700',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const EXIT_MS = 200;

// Slides in from the top and dismisses itself. Two timers rather than one so the
// fade-out actually plays: unmounting straight from the visible state would cut
// the exit animation off at frame zero.
export default function Toast({ message, tone = 'success', duration = 3200, onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!message) return undefined;
    setExiting(false);
    const exitTimer = setTimeout(() => setExiting(true), duration);
    const doneTimer = setTimeout(() => onDone?.(), duration + EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [message, duration, onDone]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`${exiting ? 'toast-out' : 'toast-in'} pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-card-hover ${
          TONES[tone] ?? TONES.success
        }`}
      >
        {tone === 'success' && (
          <span className="pop-in flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
            <CheckIcon className="h-3 w-3" strokeWidth="3.5" />
          </span>
        )}
        {message}
      </div>
    </div>
  );
}
