// The single card primitive. Every panel, entry, and stat tile is one of these
// so elevation, radius, and padding can't drift page to page.
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
};

export default function Card({
  as: Tag = 'div',
  padding = 'md',
  interactive = false,
  tone = 'default',
  className = '',
  children,
  ...props
}) {
  const tones = {
    default: 'border-gray-200 bg-white',
    brand: 'border-brand-100 bg-brand-50/60',
    accent: 'border-accent-200 bg-accent-50/60',
    danger: 'border-red-200 bg-white',
  };

  return (
    <Tag
      className={[
        'rounded-lg border shadow-card transition-all duration-150 ease-out',
        tones[tone] ?? tones.default,
        PADDING[padding] ?? PADDING.md,
        interactive
          ? 'hover:border-brand-300 hover:shadow-card-hover motion-safe:hover:-translate-y-0.5'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Section header used inside cards and above card groups, so heading sizes stay
// on one scale.
export function CardHeader({ title, hint, action, level = 'h2' }) {
  const Heading = level;
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Heading className="font-semibold text-gray-900">{title}</Heading>
        {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
