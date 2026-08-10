import { Link } from 'react-router-dom';

const BENEFITS = [
  { title: 'Write freely', body: 'A calm, distraction-free space for daily reflection.' },
  { title: 'See your patterns', body: 'Claude quietly extracts recurring themes and emotions over time.' },
  { title: 'Stay private', body: 'Your entries are yours — encrypted at rest, never shared.' },
  { title: 'Build clarity', body: 'Weekly summaries help you notice what shifted, and what didn’t.' },
];

const PLANS = [
  { name: 'Free', price: '$0', features: ['3 journal entries', 'Basic insights'] },
  { name: 'Pro', price: '$12/mo', features: ['Unlimited entries', 'Full insights', 'Weekly email summary'] },
  { name: 'Premium', price: '$29/mo', features: ['Everything in Pro', 'Export to PDF', 'Custom themes'] },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-semibold text-calm-800">AI-Powered Journaling for Mental Clarity</h1>
        <p className="mx-auto mt-4 max-w-xl text-calm-600">
          Write a few honest sentences a day. MindJournal notices the patterns so you don't have to.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/auth/signup" className="rounded-md bg-calm-600 px-5 py-2.5 text-white hover:bg-calm-700">
            Sign up
          </Link>
          <Link to="/auth/login" className="rounded-md border border-calm-300 px-5 py-2.5 text-calm-700 hover:bg-calm-100">
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-lg border border-calm-200 bg-white p-6">
            <h2 className="font-medium text-calm-800">{b.title}</h2>
            <p className="mt-1 text-sm text-calm-600">{b.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-medium text-calm-800">Pricing</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-lg border border-calm-200 bg-white p-6 text-center">
              <h3 className="font-semibold text-calm-800">{p.name}</h3>
              <p className="mt-2 text-2xl font-semibold text-calm-700">{p.price}</p>
              <ul className="mt-4 space-y-1 text-sm text-calm-600">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="mx-auto mt-16 max-w-xl text-center text-xs text-calm-500">
        MindJournal is not a substitute for professional mental health treatment. If you're in crisis,
        please contact a mental health professional or crisis line in your area.
      </p>
    </div>
  );
}
