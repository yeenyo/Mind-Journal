import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { api } from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import ErrorState from '../components/ErrorState';
import SuccessFlash from '../components/SuccessFlash';
import { buttonClasses } from '../lib/buttonStyles';
import EmptyState from '../components/EmptyState';
import { BookIcon, PatternIcon, PencilIcon } from '../components/Icons';
import PlanBadge from '../components/PlanBadge';
import { SkeletonList } from '../components/Skeleton';

const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' };

// Spec asks for the first 100 characters, so it's cut on the string rather than
// with line-clamp — a CSS clamp would cut at a line boundary instead.
const PREVIEW_CHARS = 100;

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMinutes(minutes) {
  if (!minutes) return '0m';
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`;
}

function previewText(content) {
  const flat = (content ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_CHARS ? `${flat.slice(0, PREVIEW_CHARS).trimEnd()}…` : flat;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { tier, loading: tierLoading, refresh: refreshTier } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [week, setWeek] = useState(null);
  const [justUpgraded, setJustUpgraded] = useState(false);

  const loadEntries = useCallback(async ({ isRetry = false } = {}) => {
    if (isRetry) setRetrying(true);
    try {
      const data = await api.getEntries();
      setEntries((data ?? []).slice(0, 10));
      // Cleared only on success, so a retry keeps the ErrorState mounted (with
      // its spinner) instead of flashing the empty state mid-request.
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // This week's ADHD summary. Returns {locked:true} on Free, which just means
  // the paid widgets stay hidden.
  useEffect(() => {
    api
      .getInsights('7d')
      .then(setWeek)
      .catch(() => setWeek(null));
  }, [tier]);

  useEffect(() => {
    if (searchParams.get('upgraded') !== 'true') return undefined;
    setJustUpgraded(true);
    setSearchParams({}, { replace: true });
    const timers = [setTimeout(refreshTier, 1500), setTimeout(refreshTier, 4000)];
    return () => timers.forEach(clearTimeout);
  }, [searchParams, setSearchParams, refreshTier]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = user?.email ? user.email.split('@')[0] : '';
  const showPaidWidgets = week && !week.locked;

  // The tier refresh lands a beat after redirect, so the plan name is only named
  // once it's actually known — never announce "Free" right after an upgrade.
  const upgradedMessage =
    tier && tier !== 'free'
      ? `You’re on ${PLAN_LABELS[tier] ?? 'your new'} plan. Your next entry gets analysed.`
      : 'Subscription active. Your next entry gets analysed.';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {greeting}
            {name && <span className="text-gray-500">, {name}</span>}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Nothing to catch up on. Just write what happened.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <PlanBadge tier={tier} loading={tierLoading} />
          {!tierLoading && tier === 'free' && (
            <Link to="/settings" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              Upgrade
            </Link>
          )}
        </div>
      </header>

      {justUpgraded && (
        <div className="mt-6">
          <SuccessFlash
            message={upgradedMessage}
            duration={4000}
            onDone={() => setJustUpgraded(false)}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/entry/new"
          className={`${buttonClasses({ variant: 'primary', size: 'lg', fullWidth: true })} sm:w-auto`}
        >
          <PencilIcon className="h-5 w-5" />
          Write entry
        </Link>
        <Link
          to="/insights"
          className={`${buttonClasses({ variant: 'secondary', size: 'md', fullWidth: true })} sm:w-auto`}
        >
          <PatternIcon className="h-4 w-4" />
          Your patterns
        </Link>
      </div>

      {showPaidWidgets && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card as="section">
            <CardHeader title="Avoiding this week" />
            {week.avoidanceTriggers?.length ? (
              <ul className="flex flex-col gap-2">
                {week.avoidanceTriggers.slice(0, 4).map((t) => (
                  <li key={t.trigger} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm capitalize text-gray-800">
                      {t.trigger}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">
                      {t.frequency}×
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nothing flagged yet this week.</p>
            )}
          </Card>

          <Card as="section">
            <CardHeader title="Time this week" />
            {week.timeEstimation?.length && week.timeTotals ? (
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">You estimated</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-gray-900">
                    {formatMinutes(week.timeTotals.estimatedMinutes)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">It actually took</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-gray-900">
                    {formatMinutes(week.timeTotals.actualMinutes)}
                  </dd>
                </div>
                {week.timeTotals.underestimatePct != null && (
                  <div className="flex justify-between gap-3 border-t border-gray-100 pt-2">
                    <dt className="text-gray-600">Off by</dt>
                    <dd className="shrink-0 font-semibold tabular-nums text-brand-700">
                      {week.timeTotals.underestimatePct > 0 ? '+' : ''}
                      {week.timeTotals.underestimatePct}%
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">
                No time estimates logged this week. Write how long you thought something would take.
              </p>
            )}
          </Card>
        </div>
      )}

      {week?.locked && !tierLoading && (
        <Card as="section" tone="brand" className="mt-8">
          <h2 className="font-semibold text-gray-900">
            You’re not lazy. Your brain works differently.
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
            Pro reads each entry for what you’re avoiding, where time went, and how you were feeling
            — then shows the pattern across weeks.
          </p>
          <Link to="/settings" className={`mt-4 ${buttonClasses({ size: 'sm' })}`}>
            See Pro — £9.99/mo
          </Link>
        </Card>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Your entries</h2>
          {!loading && !error && entries.length > 0 && (
            <span className="shrink-0 text-xs text-gray-500">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {loading && (
          <div className="mt-4">
            <SkeletonList count={3} />
          </div>
        )}

        {!loading && error && (
          <div className="mt-4">
            <ErrorState
              title="Couldn’t load your entries"
              message={error}
              onRetry={() => loadEntries({ isRetry: true })}
              retrying={retrying}
            />
          </div>
        )}

        {!loading && !error && !entries.length && (
          <div className="mt-4">
            <EmptyState
              icon={<BookIcon />}
              title="Start your first entry"
              body="Two sentences counts. Write what you’re avoiding right now."
              action={
                // md, not lg: the header's "Write entry" stays the single
                // largest action on the page.
                <Link to="/entry/new" className={buttonClasses({ size: 'md' })}>
                  <PencilIcon className="h-4 w-4" />
                  Write your first entry
                </Link>
              }
            />
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {entries.map((entry, i) => (
              <Card
                as="li"
                key={entry.id}
                interactive
                padding="none"
                className="fade-in stagger-item"
                style={{ '--stagger-index': i }}
              >
                <Link to={`/entry/${entry.id}`} className="press block rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs font-medium text-gray-500">
                      {formatDate(entry.created_at)}
                    </p>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600">
                      {entry.word_count} words
                    </span>
                  </div>
                  <p className="mt-2 break-words leading-relaxed text-gray-800">
                    {previewText(entry.content)}
                  </p>
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
