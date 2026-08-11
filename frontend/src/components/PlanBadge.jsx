const STYLES = {
  free: 'border-gray-300 bg-gray-100 text-gray-700',
  pro: 'border-brand-200 bg-brand-50 text-brand-700',
  premium: 'border-accent-200 bg-accent-50 text-accent-700',
};

const LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' };

export default function PlanBadge({ tier, loading = false, className = '' }) {
  if (loading) {
    return (
      <span
        className={`inline-block h-7 w-24 animate-pulse rounded-full bg-gray-200 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const key = tier ?? 'free';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        STYLES[key] ?? STYLES.free
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {LABELS[key] ?? 'Free'} plan
    </span>
  );
}
