import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { api } from '../lib/api';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Field from '../components/Field';
import Spinner from '../components/Spinner';
import { buttonClasses } from '../lib/buttonStyles';
import { CheckIcon, ChevronDownIcon } from '../components/Icons';

const MIN_TASK_LENGTH = 3;

function totalMinutes(steps) {
  return steps.reduce((sum, step) => sum + (Number(step.minutes) || 0), 0);
}

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

// A single step. The whole row is the label, so the tap target is the width of
// the card rather than a 16px box — this is a feature for people whose hands
// shake or who are using it one-handed on a phone.
function Step({ step, index, checked, disabled, onToggle }) {
  return (
    <Card
      as="li"
      padding="none"
      className={`transition-colors ${checked ? 'border-accent-200 bg-accent-50/50' : ''}`}
    >
      <label className="flex cursor-pointer items-start gap-3 p-3.5 sm:p-4">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(index)}
          className="sr-only"
        />
        {/* Custom box rather than the native control: the native one can't carry
            the tick animation, and at 375px the default is a ~13px target. */}
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
            checked
              ? 'border-accent-500 bg-accent-500 text-white'
              : 'border-gray-300 bg-white'
          }`}
        >
          {checked && <CheckIcon className="pop-in h-3.5 w-3.5" strokeWidth="3.5" />}
        </span>

        <span
          className={`min-w-0 flex-1 text-sm leading-relaxed transition-colors ${
            checked ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}
        >
          {step.step}
        </span>

        {step.minutes != null && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600">
            {step.minutes}m
          </span>
        )}
      </label>
    </Card>
  );
}

function StepList({ breakdown, onToggle, saving, error }) {
  const steps = breakdown.steps ?? [];
  const doneCount = steps.filter((step) => step.done).length;
  const allDone = steps.length > 0 && doneCount === steps.length;
  const remaining = totalMinutes(steps.filter((step) => !step.done));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium text-gray-700">
          {doneCount} of {steps.length} done
          {!allDone && remaining > 0 && (
            <span className="font-normal text-gray-500"> · {formatMinutes(remaining)} left</span>
          )}
        </p>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Spinner className="h-3 w-3" />
            Saving
          </span>
        )}
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-label="Steps completed"
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-300 ease-out"
          style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <Step
            key={i}
            step={step}
            index={i}
            checked={Boolean(step.done)}
            disabled={!onToggle}
            onToggle={onToggle}
          />
        ))}
      </ol>

      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}

      {allDone && (
        <Card tone="accent" padding="sm" className="flash-in mt-3">
          <p className="text-sm font-medium text-accent-700">
            That’s the whole thing done. Worth noticing — you did the task you were stuck on.
          </p>
        </Card>
      )}

      {!allDone && breakdown.encouragement && (
        <Card tone="accent" padding="sm" className="mt-3">
          <p className="text-sm leading-relaxed text-gray-800">{breakdown.encouragement}</p>
        </Card>
      )}
    </div>
  );
}

export default function Breakdown() {
  const { tier, loading: tierLoading } = useProfile();
  const location = useLocation();
  // EntryDetail can send you here with the task pre-filled from what the entry
  // said you were avoiding, so you don't have to re-type it while stuck.
  const [task, setTask] = useState(location.state?.task ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resultId, setResultId] = useState(null);
  const [history, setHistory] = useState([]);
  const [savingId, setSavingId] = useState(null);
  // Keyed by breakdown id so a failed tick reports itself next to the checklist
  // it belongs to, not at the top of a page that may be scrolled well away.
  const [saveError, setSaveError] = useState(null);

  const isPremium = tier === 'premium';
  const taskValid = task.trim().length >= MIN_TASK_LENGTH;

  useEffect(() => {
    if (!isPremium) return;
    api
      .getBreakdowns()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [isPremium]);

  async function runBreakdown() {
    setError('');
    setResultId(null);
    setBusy(true);
    try {
      const created = await api.createBreakdown(task);
      setHistory((current) => [created, ...current]);
      setResultId(created.id);
      setTask('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Optimistic: the tick lands immediately and rolls back if the write fails.
  // Waiting ~200ms for a round trip before a checkbox responds is exactly the
  // kind of friction that makes people stop using a checklist.
  const toggleStep = useCallback(
    async (breakdownId, index) => {
      // The next state is derived from `history` here rather than inside a
      // setHistory updater. React runs updater functions during a later render,
      // not synchronously, so values assigned to outer variables from inside one
      // are still undefined on the next line — and under StrictMode the updater
      // also runs twice, which would double-toggle. Reading state directly keeps
      // the computation and the network call in agreement.
      const snapshot = history.find((item) => item.id === breakdownId);
      if (!snapshot) return;

      const steps = snapshot.steps.map((step, i) =>
        i === index ? { ...step, done: !step.done } : step,
      );
      const nextDone = steps.map((step) => Boolean(step.done));

      setHistory((current) =>
        current.map((item) => (item.id === breakdownId ? { ...item, steps } : item)),
      );

      setSavingId(breakdownId);
      setSaveError(null);
      try {
        const updated = await api.updateBreakdownProgress(breakdownId, nextDone);
        setHistory((current) =>
          current.map((item) => (item.id === breakdownId ? updated : item)),
        );
      } catch (err) {
        setSaveError({ id: breakdownId, message: `Couldn’t save that: ${err.message}` });
        setHistory((current) =>
          current.map((item) => (item.id === breakdownId ? snapshot : item)),
        );
      } finally {
        setSavingId(null);
      }
    },
    [history],
  );

  function handleSubmit(e) {
    e.preventDefault();
    runBreakdown();
  }

  const result = history.find((item) => item.id === resultId) ?? null;
  const earlier = history.filter((item) => item.id !== resultId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Break it down
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Paralysed by a task that’s too big to see? Name it, and get steps small enough to start.
        </p>
      </header>

      {tierLoading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <Spinner />
          Checking your plan…
        </p>
      )}

      {!tierLoading && !isPremium && (
        <Card tone="brand" className="mt-6">
          <h2 className="font-semibold text-gray-900">Upgrade to Premium to break down tasks</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            The breakdown assistant turns “clean my room” into four to six steps you can actually
            start, each with a time estimate, and keeps them as a checklist you can tick off.
          </p>
          <Link to="/settings" className={`mt-5 ${buttonClasses({})}`}>
            See Premium — £24.99/mo
          </Link>
        </Card>
      )}

      {isPremium && (
        <>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field
              label="What needs doing?"
              placeholder="e.g. clean my room, file my tax return"
              hint="Plain words are fine. No need to be specific."
              required
              minLength={MIN_TASK_LENGTH}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={busy}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="sm:self-start"
                disabled={!taskValid}
                loading={busy}
                loadingText="Breaking it down…"
              >
                Generate breakdown
              </Button>
              <p className="text-xs leading-relaxed text-gray-500" aria-live="polite">
                {busy ? 'A few seconds — hang on.' : 'Usually just a few seconds.'}
              </p>
            </div>
          </form>

          <Alert
            tone="error"
            className="mt-4"
            action={
              <Button size="sm" variant="secondary" onClick={runBreakdown} disabled={!taskValid}>
                Try again
              </Button>
            }
          >
            {error}
          </Alert>

          {result && (
            <section className="fade-in mt-8">
              <h2 className="text-lg font-semibold text-gray-900">{result.task}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {result.steps.length} steps · about {formatMinutes(totalMinutes(result.steps))} in
                total. Start with the first one — that’s the whole job for now.
              </p>
              <div className="mt-4">
                <StepList
                  breakdown={result}
                  onToggle={(index) => toggleStep(result.id, index)}
                  saving={savingId === result.id}
                  error={saveError?.id === result.id ? saveError.message : ''}
                />
              </div>
            </section>
          )}

          {earlier.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gray-900">Earlier breakdowns</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {earlier.map((item) => {
                  const doneCount = item.steps.filter((step) => step.done).length;
                  return (
                    <Card as="li" padding="sm" key={item.id}>
                      <details className="group">
                        <summary className="press flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="min-w-0 truncate font-medium text-gray-900">
                                {item.task}
                              </span>
                              {item.completed_at && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                                  <CheckIcon className="h-3 w-3" strokeWidth="3" />
                                  Done
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()} · {doneCount}/
                              {item.steps.length} steps
                            </span>
                          </span>
                          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="mt-3">
                          <StepList
                            breakdown={item}
                            onToggle={(index) => toggleStep(item.id, index)}
                            saving={savingId === item.id}
                            error={saveError?.id === item.id ? saveError.message : ''}
                          />
                        </div>
                      </details>
                    </Card>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
