import { useEffect } from 'react';

// Shared chrome for the six informational pages, so their headers, measure, and
// rhythm can't drift apart. Body copy is capped near 65 characters per line —
// long measure is one of the fastest ways to lose an ADHD reader.
export default function InfoPage({ eyebrow, title, lede, children, width = 'md' }) {
  const maxWidth = width === 'lg' ? 'max-w-5xl' : 'max-w-3xl';

  // These pages are entered from footer links partway down another page, so
  // without this you land mid-document with no obvious way to tell you moved.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className={`mx-auto ${maxWidth} px-4 py-12 sm:px-6 sm:py-16`}>
      <header className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        {lede && <p className="mt-4 text-base leading-relaxed text-gray-600">{lede}</p>}
      </header>
      <div className="mt-10">{children}</div>
    </div>
  );
}

// Consistent section break for long-form info pages.
export function Section({ title, hint, children, className = '' }) {
  return (
    <section className={`mt-12 first:mt-0 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
      )}
      {hint && <p className="mt-2 text-sm text-gray-600">{hint}</p>}
      <div className={title || hint ? 'mt-5' : ''}>{children}</div>
    </section>
  );
}

// Body paragraph with the reading measure and leading already set.
export function Prose({ children, className = '' }) {
  return (
    <p className={`text-[15px] leading-relaxed text-gray-700 ${className}`}>{children}</p>
  );
}
