import { Link } from 'react-router-dom';
import { LockIcon } from './Icons';

// Grouped rather than one long link row: at 375px a flat list of eight links
// wraps into an unreadable block, and the grouping doubles as a map of what the
// site actually contains.
const GROUPS = [
  {
    heading: 'Product',
    links: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/pricing-faq', label: 'Plans & pricing' },
      { to: '/resources', label: 'ADHD resources' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { to: '/privacy-and-terms', label: 'Privacy policy' },
      { to: '/privacy-and-terms#terms', label: 'Terms of service' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="print:hidden border-t border-gray-200 bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link
              to="/"
              className="icon-tilt-parent inline-flex items-center gap-2 font-semibold tracking-tight text-gray-900"
            >
              <span className="icon-tilt flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                M
              </span>
              MindJournal
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Journaling that reads you back. Built for ADHD brains.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.heading} aria-labelledby={`footer-${group.heading}`}>
              <h2
                id={`footer-${group.heading}`}
                className="text-xs font-semibold uppercase tracking-wide text-gray-900"
              >
                {group.heading}
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="link-underline text-sm text-gray-600 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6">
          {/* Analysis goes to Anthropic's API under their standard terms — never used
              to train models. Storage is a separate promise — don't imply we keep
              nothing. */}
          <p className="flex items-start gap-2 text-xs font-medium text-gray-600">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            Your entries are analysed by Anthropic’s Claude API, never used to train models, and
            never sold.
          </p>
          <p className="text-xs leading-relaxed text-gray-500">
            MindJournal is not a substitute for ADHD diagnosis, treatment, or professional mental
            health care. If you’re in crisis, contact a mental health professional or a crisis line
            in your area.
          </p>
        </div>
      </div>
    </footer>
  );
}
