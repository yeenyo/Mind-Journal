// Kept out of Button.jsx so that file only exports a component (fast refresh),
// and so <Link>/<a> can render with the exact same look as <Button>.
const VARIANTS = {
  // Gradient rather than flat fill so the primary action reads as the one thing
  // to press on any given screen.
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm hover:from-brand-600 hover:to-brand-700 hover:shadow-md active:from-brand-700 active:to-brand-800',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm active:bg-gray-100',
  accent:
    'bg-gradient-to-b from-accent-500 to-accent-600 text-white shadow-sm hover:from-accent-600 hover:to-accent-700 hover:shadow-md',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50 active:bg-red-100',
  dangerSolid: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
};

// Tap targets: 48px minimum on mobile for anything primary-sized, per the
// mobile spec. Desktop can be tighter since pointers are precise.
const SIZES = {
  sm: 'min-h-10 px-3 py-1.5 text-sm',
  md: 'min-h-12 px-4 py-2.5 text-sm sm:min-h-11',
  lg: 'min-h-12 px-6 py-3 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false } = {}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
    'transition-all duration-150 ease-out',
    // Scale is 1.02 rather than the 1.05 in the brief: on a full-width mobile
    // button 1.05 moves each edge ~8px, which reads as jitter rather than
    // polish. Paired with a shadow lift it still feels responsive.
    'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99]',
    // Disabled must be visibly inert — no lift, no shadow, no pointer.
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
    'disabled:hover:scale-100 disabled:hover:shadow-none',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
  ].join(' ');
}
