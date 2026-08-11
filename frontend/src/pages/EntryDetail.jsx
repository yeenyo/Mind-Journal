import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useProfile } from '../hooks/useProfile';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ArrowLeftIcon, DownloadIcon, ListIcon, LockIcon } from '../components/Icons';
import { buttonClasses } from '../lib/buttonStyles';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function wordsIn(entry) {
  if (entry.word_count != null) return entry.word_count;
  return (entry.content ?? '').trim().split(/\s+/).filter(Boolean).length;
}

function cleanList(items) {
  return Array.isArray(items) ? items.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function emotionalSummary(insight) {
  if (!insight?.emotional_detected) return null;
  const type = insight.emotional_type?.trim() || null;
  const intensity = insight.emotional_intensity != null ? `${insight.emotional_intensity}/10` : null;
  // "Detected" with nothing attached is not data — an empty card is worse than none.
  if (!type && !intensity) return null;
  return { type, intensity };
}

function timingSummary(insight) {
  if (!insight) return null;
  const estimated =
    insight.time_estimated ??
    (insight.estimated_minutes != null ? `${insight.estimated_minutes} min` : null);
  const actual =
    insight.time_actual ?? (insight.actual_minutes != null ? `${insight.actual_minutes} min` : null);
  if (!estimated && !actual) return null;

  let difference = insight.time_difference ?? null;
  if (!difference && insight.estimated_minutes != null && insight.actual_minutes != null) {
    const delta = insight.actual_minutes - insight.estimated_minutes;
    difference =
      delta === 0 ? 'Spot on' : `${Math.abs(delta)} min ${delta > 0 ? 'over' : 'under'}`;
  }

  return { estimated: estimated ?? '—', actual: actual ?? '—', difference };
}

function buildExport(entry, insight) {
  const lines = [
    `# Journal entry — ${formatDate(entry.created_at)}`,
    '',
    `${formatTime(entry.created_at)} · ${wordsIn(entry)} words`,
    '',
    (entry.content ?? '').trim(),
  ];

  if (insight) {
    const avoidance = cleanList(insight.avoidance_triggers);
    const timeBlindness = cleanList(insight.time_blindness_indicators);
    const emotional = emotionalSummary(insight);
    const timing = timingSummary(insight);

    lines.push('', '## Your patterns', '');
    if (avoidance.length) lines.push(`**Avoiding:** ${avoidance.join(', ')}`, '');
    if (timeBlindness.length) {
      lines.push('**Time blindness:**', ...timeBlindness.map((item) => `- ${item}`), '');
    }
    if (emotional) {
      lines.push(
        `**Emotional state:** ${[emotional.type, emotional.intensity && `intensity ${emotional.intensity}`]
          .filter(Boolean)
          .join(' — ')}`,
        ''
      );
    }
    if (insight.hyperfocus_detected) {
      lines.push(`**Hyperfocus:** ${insight.hyperfocus_topic ?? 'detected in this entry'}`, '');
    }
    if (timing) {
      lines.push(
        `**Estimate vs actual:** ${timing.estimated} -> ${timing.actual}${
          timing.difference ? ` (${timing.difference})` : ''
        }`,
        ''
      );
    }
    if (insight.adhd_insights) lines.push('**What this shows:**', insight.adhd_insights, '');
    if (insight.actionable_suggestion) lines.push('**Try this:**', insight.actionable_suggestion, '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function MetricCard({ label, labelClass = 'text-gray-500', children }) {
  return (
    <Card padding="sm" className="min-w-0">
      <p className={`text-xs font-medium uppercase tracking-wide ${labelClass}`}>{label}</p>
      <div className="mt-2 min-w-0">{children}</div>
    </Card>
  );
}

function ChipList({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="max-w-full break-words rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tier, loading: tierLoading, error: tierError } = useProfile();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  // Passed from NewEntry via navigation state right after a fresh save — a
  // page refresh or a link from Dashboard won't have it, which is correct:
  // it's "analysis just failed", not a permanent property of the entry.
  const [freshAnalysisError, setFreshAnalysisError] = useState(location.state?.analysisError ?? null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setError('');
    return api
      .getEntry(id)
      .then(setEntry)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  function handleReload() {
    setReloading(true);
    load().finally(() => setReloading(false));
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const result = await api.analyzeEntry(entry.id);
      // The endpoint may hand back the insight row itself or an entry wrapping
      // one; accept either, and refuse anything that carries no analysis fields
      // rather than rendering an empty "Your Patterns".
      const insight = result?.insight ?? result;
      const usable =
        insight &&
        typeof insight === 'object' &&
        ('adhd_insights' in insight || 'avoidance_triggers' in insight);
      if (!usable) throw new Error('The analysis came back empty. Try again in a moment.');
      setEntry((prev) => ({ ...prev, insight }));
      setFreshAnalysisError(null);
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleExport() {
    try {
      const blob = new Blob([buildExport(entry, entry.insight)], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindjournal-entry-${new Date(entry.created_at).toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Couldn’t build the download: ${err.message}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteEntry(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const backLink = (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back to dashboard
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {backLink}
        <Card className="mt-6">
          <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-11/12 animate-pulse rounded bg-gray-200" />
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {backLink}
        <div className="mt-6">
          <ErrorState
            title="We couldn’t open this entry"
            message={error}
            onRetry={handleReload}
            retrying={reloading}
          />
        </div>
      </div>
    );
  }

  const insight = entry.insight;
  const avoidance = cleanList(insight?.avoidance_triggers);
  const timeBlindness = cleanList(insight?.time_blindness_indicators);
  const emotional = emotionalSummary(insight);
  const hyperfocus = insight?.hyperfocus_detected
    ? (insight.hyperfocus_topic?.trim() || 'Detected in this entry')
    : null;
  const timing = timingSummary(insight);
  const hasAnalysisContent = Boolean(
    avoidance.length ||
      timeBlindness.length ||
      emotional ||
      hyperfocus ||
      timing ||
      insight?.adhd_insights ||
      insight?.actionable_suggestion
  );

  const paid = tier === 'pro' || tier === 'premium';
  // Four mutually exclusive outcomes so a hiccup never reads as an upsell and
  // an upsell is never shown to someone already paying.
  let analysisState = 'ready';
  if (!insight) {
    if (freshAnalysisError || paid) analysisState = 'failed';
    else if (tierLoading) analysisState = 'checking';
    else if (tierError) analysisState = 'planUnknown';
    else analysisState = 'free';
  }

  const wordTotal = wordsIn(entry);

  // Pre-fills the breakdown form with what the analysis says you're avoiding, so
  // the task doesn't have to be re-typed from scratch while you're stuck on it.
  // Falls back to an empty form when there's no analysis or nothing was flagged.
  const breakdownSuggestion = avoidance[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {backLink}

      <Card as="article" className="fade-in mt-6">
        <header className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {formatDate(entry.created_at)}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {formatTime(entry.created_at)} · {wordTotal} {wordTotal === 1 ? 'word' : 'words'}
          </p>
        </header>
        <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-800 sm:text-base">
          {entry.content}
        </p>
      </Card>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Your Patterns</h2>

        {analysisState === 'ready' && (
          <div className="mt-4 flex flex-col gap-4">
            {hasAnalysisContent ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {avoidance.length > 0 && (
                    <MetricCard label="Avoiding">
                      <ChipList items={avoidance} />
                    </MetricCard>
                  )}

                  {timeBlindness.length > 0 && (
                    <MetricCard label="Time blindness">
                      <ul className="flex flex-col gap-1.5 text-sm text-gray-700">
                        {timeBlindness.map((item, i) => (
                          <li key={`${item}-${i}`} className="flex gap-2">
                            <span aria-hidden="true" className="text-gray-400">
                              •
                            </span>
                            <span className="min-w-0 break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </MetricCard>
                  )}

                  {emotional && (
                    <MetricCard label="Emotional state">
                      {emotional.type && (
                        <p className="text-sm font-semibold capitalize text-gray-900">
                          {emotional.type}
                        </p>
                      )}
                      {emotional.intensity && (
                        <p className="mt-0.5 text-sm text-gray-600">
                          Intensity {emotional.intensity}
                        </p>
                      )}
                    </MetricCard>
                  )}

                  {hyperfocus && (
                    <MetricCard label="Hyperfocus" labelClass="text-accent-700">
                      <p className="break-words text-sm font-semibold text-gray-900">{hyperfocus}</p>
                    </MetricCard>
                  )}

                  {timing && (
                    <MetricCard label="Estimate vs actual">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <span className="break-words">{timing.estimated}</span>
                        <span aria-hidden="true" className="text-gray-400">
                          →
                        </span>
                        <span className="break-words">{timing.actual}</span>
                      </p>
                      {timing.difference && (
                        <p className="mt-0.5 text-sm text-gray-600">{timing.difference}</p>
                      )}
                    </MetricCard>
                  )}
                </div>

                {insight.adhd_insights && (
                  <Card tone="brand">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      What this shows
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-800">
                      {insight.adhd_insights}
                    </p>
                  </Card>
                )}

                {insight.actionable_suggestion && (
                  <Card tone="accent">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent-700">
                      Try this
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-800">
                      {insight.actionable_suggestion}
                    </p>
                  </Card>
                )}
              </>
            ) : (
              <Alert tone="info">
                Analysis ran on this entry and didn’t find any patterns worth flagging. That’s a real
                result, not a failure.
              </Alert>
            )}
          </div>
        )}

        {analysisState === 'failed' && (
          <div className="mt-4 flex flex-col gap-3">
            <ErrorState
              title="Analysis unavailable"
              message={
                analyzeError ||
                freshAnalysisError ||
                'Your plan includes pattern analysis, but this entry never got any. That’s on our side, not yours.'
              }
              onRetry={handleAnalyze}
              retrying={analyzing}
            />
          </div>
        )}

        {analysisState === 'checking' && (
          <Card className="mt-4">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-3 w-56 animate-pulse rounded bg-gray-200" />
          </Card>
        )}

        {analysisState === 'planUnknown' && (
          <Alert tone="warning" className="mt-4">
            We couldn’t check which plan you’re on, so patterns stay hidden for now: {tierError}
          </Alert>
        )}

        {analysisState === 'free' && (
          <div className="mt-4">
            <EmptyState
              icon={<LockIcon className="h-5 w-5" />}
              title="Upgrade to Pro to see patterns"
              body="Pro reads your entries back to you — what you’re avoiding, where time slipped, how loaded the day felt. Writing stays free and unlimited either way."
              action={
                <Link to="/settings" className={buttonClasses({ size: 'md' })}>
                  See Pro
                </Link>
              }
            />
          </div>
        )}
      </section>

      {/* Break-it-down entry point. It sits directly under the patterns because
          that's the moment the avoidance is named and the impulse to act on it
          is strongest — a link buried in the nav gets found much later, if at
          all. Only shown once the plan is known, so nobody sees an upsell flash
          before we've confirmed they're already paying for it. */}
      {!tierLoading && (
        <section className="mt-8">
          {tier === 'premium' ? (
            <Card tone="brand" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Stuck on something in here?</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {breakdownSuggestion
                    ? `Turn “${breakdownSuggestion}” into steps small enough to start.`
                    : 'Name the task and get steps small enough to start.'}
                </p>
              </div>
              <Link
                to="/breakdown"
                state={{ task: breakdownSuggestion ?? '' }}
                className={`shrink-0 ${buttonClasses({})}`}
              >
                <ListIcon className="h-4 w-4" />
                Break this down
              </Link>
            </Card>
          ) : (
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <LockIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  Upgrade to Premium to break down tasks
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Premium turns the thing you’re avoiding into four to six steps with time
                  estimates, as a checklist you can tick off.
                </p>
              </div>
              <Link
                to="/settings"
                className={`shrink-0 ${buttonClasses({ variant: 'secondary' })}`}
              >
                See Premium
              </Link>
            </Card>
          )}
        </section>
      )}

      <Alert tone="error" className="mt-6">
        {error}
      </Alert>

      <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={handleExport}>
          <DownloadIcon className="h-4 w-4" />
          Export this entry
        </Button>
        <Button variant="danger" className="w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
          Delete entry
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this entry?"
        body="This permanently removes the entry and its analysis. This can’t be undone."
        confirmLabel="Delete entry"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
