import Card from './Card';

// Auth screens have no page chrome of their own, so the card *is* the page: the
// gradient frames it and the footer keeps cross-links outside the card body.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-brand-50 via-gray-50 to-accent-50/40 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Card padding="none" className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
        {footer && <div className="mt-5 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}
