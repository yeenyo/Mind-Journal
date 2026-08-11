const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-accent-200 bg-accent-50 text-accent-700',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const ICONS = {
  error: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  success: 'M20 6 9 17l-5-5',
  info: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  warning: 'M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
};

// `action` is for a recovery affordance — a Try again button belongs inside the
// message that explains what failed, not somewhere else on the page.
export default function Alert({ tone = 'error', children, action, className = '' }) {
  if (!children) return null;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex flex-wrap items-start gap-2.5 rounded-lg border p-3.5 text-sm ${
        TONES[tone] ?? TONES.error
      } ${className}`}
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={ICONS[tone] ?? ICONS.error} />
      </svg>
      <span className="min-w-0 flex-1">{children}</span>
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}
