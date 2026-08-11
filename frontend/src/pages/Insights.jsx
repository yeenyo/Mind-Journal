import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import useCountUp from '../hooks/useCountUp';
import Alert from '../components/Alert';
import { buttonClasses } from '../lib/buttonStyles';
import EmptyState from '../components/EmptyState';
import { PatternIcon } from '../components/Icons';
import { SkeletonList } from '../components/Skeleton';
import {
  AvoidanceBars,
  EmotionalTrend,
  EstimateVsActual,
  TimeBlindnessTimeline,
} from '../components/Charts';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

function Panel({ title, hint, children }) {
  return (
    <section className="fade-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Nothing({ children }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

// Stat tiles count up from zero on load. It's the one place a little motion
// earns its keep: it draws the eye to the numbers that summarise the range
// before you start reading charts. `tabular-nums` keeps the width steady so
// nothing jitters while the digits change.
function Stat({ label, value, hint, format = (n) => n }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const isNumeric = typeof value === 'number';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1.5 font-semibold text-slate-900 ${
          isNumeric ? 'text-2xl tabular-nums' : 'truncate text-lg capitalize'
        }`}
      >
        {isNumeric ? format(animated) : value}
      </p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function Insights() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    api
      .getInsights(range)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Your ADHD Patterns
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          What your own entries say about how your brain is running.
        </p>
      </header>

      {!data?.locked && (
        <div
          role="group"
          aria-label="Date range"
          className="mt-5 inline-flex w-full rounded-lg border border-slate-300 bg-white p-1 sm:w-auto"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              onClick={() => setRange(r.value)}
              className={`press flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                range === r.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <Alert tone="error" className="mt-5">
        {error}
      </Alert>

      {!data && !error && (
        <div className="mt-6">
          <SkeletonList count={3} />
        </div>
      )}

      {data?.locked && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 p-6">
          <h2 className="font-semibold text-slate-900">Analysis is a Pro feature</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Keep writing for free as long as you like — your entries are yours either way. Pro reads
            each entry for avoidance triggers, lost time, and emotional patterns, then shows you the
            trend across weeks.
          </p>
          <Link to="/settings" className={`mt-5 ${buttonClasses({})}`}>
            See Pro — £9.99/mo
          </Link>
        </div>
      )}

      {data && !data.locked && (
        <div className="mt-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Analysed"
              value={data.analysedEntries}
              hint={`of ${data.totalEntries} entries`}
            />
            <Stat label="Top trigger" value={data.topTrigger ?? '—'} />
            <Stat
              label="Time underestimated"
              value={data.timeTotals.underestimatePct ?? '—'}
              format={(n) => `${n > 0 ? '+' : ''}${n}%`}
            />
            <Stat label="Hyperfocus" value={data.hyperfocus.length} hint="sessions spotted" />
          </div>

          {data.analysedEntries === 0 && (
            <EmptyState
              icon={<PatternIcon />}
              title="Nothing analysed in this range yet"
              body="Write an entry and it gets read for patterns straight away. Come back here once there’s something to compare."
              action={
                <Link to="/entry/new" className={buttonClasses({})}>
                  Write an entry
                </Link>
              }
            />
          )}

          {data.analysedEntries > 0 && (
            <>
              <Panel
                title="What you’re avoiding"
                hint="Named in your entries, counted across the range. Avoid the avoidance spiral."
              >
                {data.avoidanceTriggers.length ? (
                  <AvoidanceBars items={data.avoidanceTriggers} />
                ) : (
                  <Nothing>No avoidance showed up in this range. That’s worth noticing too.</Nothing>
                )}
              </Panel>

              <Panel
                title="Where the time went"
                hint="You lost track of time again? That’s not a character flaw — it’s the thing we’re measuring."
              >
                {data.timeBlindness.length ? (
                  <TimeBlindnessTimeline events={data.timeBlindness} />
                ) : (
                  <Nothing>No time-blindness moments recorded in this range.</Nothing>
                )}
              </Panel>

              <Panel title="Estimate vs reality" hint="What you thought it would take, against what it took.">
                {data.timeEstimation.length ? (
                  <EstimateVsActual items={data.timeEstimation} />
                ) : (
                  <Nothing>
                    No time estimates found yet. Mention how long you thought something would take,
                    and how long it actually took, and it’ll land here.
                  </Nothing>
                )}
              </Panel>

              <Panel
                title="Emotional dysregulation"
                hint="Intensity 1–10, in the order you wrote about it."
              >
                {data.emotionalTrend.length ? (
                  <EmotionalTrend points={data.emotionalTrend} />
                ) : (
                  <Nothing>Nothing logged in this range.</Nothing>
                )}
              </Panel>

              {data.hyperfocus.length > 0 && (
                <section className="rounded-xl border border-accent-200 bg-accent-50/60 p-5 sm:p-6">
                  <h2 className="font-semibold text-accent-700">Hyperfocus spotted</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    This is the upside of the same wiring. Worth pointing on purpose.
                  </p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {data.hyperfocus.map((session, i) => (
                      <li key={`${session.date}-${i}`} className="text-sm text-slate-800">
                        <span className="text-xs text-slate-500">
                          {new Date(session.date).toLocaleDateString()} —{' '}
                        </span>
                        {session.topic ?? 'topic not named'}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.strategies.length > 0 && (
                <Panel
                  title="What to try"
                  hint="Matched to the patterns above, not generic advice."
                >
                  <ul className="flex flex-col gap-5">
                    {data.strategies.map((strategy) => (
                      <li key={strategy.key}>
                        <p className="text-sm font-semibold text-slate-900">{strategy.pattern}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{strategy.blurb}</p>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {strategy.techniques.map((technique) => (
                            <li key={technique} className="flex gap-2 text-sm text-slate-700">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                              {technique}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              {data.suggestions.length > 0 && (
                <Panel title="Suggestions from your recent entries">
                  <ul className="flex flex-col gap-3">
                    {data.suggestions.map((item, i) => (
                      <li key={`${item.date}-${i}`} className="text-sm text-slate-700">
                        <span className="text-xs text-slate-500">
                          {new Date(item.date).toLocaleDateString()} —{' '}
                        </span>
                        {item.suggestion}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/report" className={buttonClasses({ variant: 'secondary' })}>
                  Printable report (PDF)
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
