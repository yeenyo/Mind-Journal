import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { buttonClasses } from '../lib/buttonStyles';

// "Export to PDF" is the browser's own print-to-PDF rather than a generated
// file — no extra dependency, and the output is a document the user can hand
// to a therapist or ADHD coach as-is.
export default function Report() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getInsights('30d')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Loading…</p>;
  }

  if (data.locked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Report is a Pro feature</h1>
        <p className="mt-2 text-sm text-slate-700">
          Pro turns your last 30 days into a one-page summary you can share with a therapist or
          coach.
        </p>
        <Link to="/settings" className={`mt-5 ${buttonClasses({})}`}>
          See Pro
        </Link>
      </div>
    );
  }

  const rangeEnd = new Date();
  const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/insights" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Back to patterns
        </Link>
        <Button onClick={() => window.print()}>Save as PDF / print</Button>
      </div>

      <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-semibold text-slate-900">ADHD pattern report</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user?.email} · {rangeStart.toLocaleDateString()} – {rangeEnd.toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {data.analysedEntries} of {data.totalEntries} entries analysed in this period.
          </p>
        </header>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Avoidance triggers
          </h2>
          {data.avoidanceTriggers.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-800">
              {data.avoidanceTriggers.map((t) => (
                <li key={t.trigger} className="flex justify-between">
                  <span className="capitalize">{t.trigger}</span>
                  <span className="tabular-nums text-slate-600">
                    {t.frequency} {t.frequency === 1 ? 'entry' : 'entries'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None recorded.</p>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Time estimation
          </h2>
          {data.timeTotals.underestimatePct == null ? (
            <p className="mt-2 text-sm text-slate-500">No estimates recorded.</p>
          ) : (
            <p className="mt-2 text-sm text-slate-800">
              Estimated {Math.round(data.timeTotals.estimatedMinutes)} minutes across{' '}
              {data.timeEstimation.length} tasks; actual{' '}
              {Math.round(data.timeTotals.actualMinutes)} minutes (
              {data.timeTotals.underestimatePct > 0 ? '+' : ''}
              {data.timeTotals.underestimatePct}%).
            </p>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Emotional dysregulation
          </h2>
          {data.emotionalTrend.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-800">
              {data.emotionalTrend.map((p, i) => (
                <li key={`${p.date}-${i}`} className="flex justify-between">
                  <span className="capitalize">{p.type ?? 'unspecified'}</span>
                  <span className="tabular-nums text-slate-600">
                    {new Date(p.date).toLocaleDateString()} · {p.intensity}/10
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None recorded.</p>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Time blindness incidents
          </h2>
          {data.timeBlindness.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-800">
              {data.timeBlindness.map((e, i) => (
                <li key={`${e.date}-${i}`}>
                  <span className="text-slate-600">{new Date(e.date).toLocaleDateString()} — </span>
                  {e.indicators.join('; ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None recorded.</p>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Hyperfocus sessions
          </h2>
          {data.hyperfocus.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-800">
              {data.hyperfocus.map((h, i) => (
                <li key={`${h.date}-${i}`}>
                  <span className="text-slate-600">{new Date(h.date).toLocaleDateString()} — </span>
                  {h.topic ?? 'topic not named'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None recorded.</p>
          )}
        </section>

        <footer className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs leading-relaxed text-slate-500">
            Generated by MindJournal from the writer’s own journal entries. This is a self-report
            summary, not a clinical assessment, diagnosis, or treatment recommendation.
          </p>
        </footer>
      </article>
    </div>
  );
}
