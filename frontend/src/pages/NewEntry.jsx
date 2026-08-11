import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Alert from '../components/Alert';
import Button from '../components/Button';

const DRAFT_KEY = 'mindjournal:draft';
const MIN_CHARS = 50;

// Prompts insert a scaffold rather than replacing the entry — ADHD writing
// sessions rarely stay on one question, and a blank page is its own barrier.
const PROMPTS = [
  { label: 'What are you avoiding?', scaffold: 'The task I’m avoiding right now:' },
  { label: 'What did you hyperfocus on?', scaffold: 'I hyperfocused on:' },
  { label: 'Rate your emotional state', scaffold: 'Emotional dysregulation today (1–10):' },
  { label: 'Did you lose track of time?', scaffold: 'I lost track of time when:' },
];

export default function NewEntry() {
  const navigate = useNavigate();
  const [content, setContent] = useState(() => localStorage.getItem(DRAFT_KEY) ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const textareaRef = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    const interval = setInterval(() => {
      if (contentRef.current) {
        localStorage.setItem(DRAFT_KEY, contentRef.current);
        setSavedAt(new Date());
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const remaining = Math.max(0, MIN_CHARS - charCount);
  const canSubmit = charCount >= MIN_CHARS && !submitting;

  const readyRef = useRef(null);
  const wasReadyRef = useRef(charCount >= MIN_CHARS);

  // Crossing the 50-character line is the moment the Save button becomes usable,
  // and that's easy to miss while you're looking at the textarea. One pulse on
  // the counter marks it. Only on the upward crossing — pulsing again when you
  // delete back under the line would be nagging.
  useEffect(() => {
    const isReady = charCount >= MIN_CHARS;
    if (isReady && !wasReadyRef.current) {
      const node = readyRef.current;
      if (node) {
        node.classList.remove('pulse-once');
        void node.offsetWidth;
        node.classList.add('pulse-once');
      }
    }
    wasReadyRef.current = isReady;
  }, [charCount]);

  function addPrompt(scaffold) {
    setContent((current) => {
      const prefix = current.trim() ? `${current.replace(/\s+$/, '')}\n\n` : '';
      return `${prefix}${scaffold} `;
    });
    textareaRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (charCount < MIN_CHARS) {
      setError(`Write at least ${MIN_CHARS} characters (currently ${charCount}).`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const entry = await api.createEntry(content);
      localStorage.removeItem(DRAFT_KEY);
      // Straight to the entry so Pro users land on their analysis. The create
      // response is the only place analysis_error/analysis_skipped exist — the
      // GET that EntryDetail does next only has the saved insight (or none),
      // so this has to travel via navigation state or it's lost silently.
      navigate(`/entry/${entry.id}`, {
        state: { analysisError: entry.analysis_error ?? null },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          What happened today?
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Messy is fine. Half-sentences are fine. Just get it out of your head.
        </p>
      </header>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Stuck? Start with one of these
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => addPrompt(prompt.scaffold)}
              disabled={submitting}
              className="press rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-400">
          <label htmlFor="entry-content" className="sr-only">
            Journal entry
          </label>
          <textarea
            id="entry-content"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            rows={14}
            placeholder="Today I…"
            className="w-full resize-y rounded-xl border-0 bg-transparent p-4 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 disabled:opacity-60 sm:p-5 sm:text-base"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
            <span>{savedAt ? `Draft saved ${savedAt.toLocaleTimeString()}` : 'Drafts save automatically'}</span>
            <span className="ml-auto tabular-nums">
              {remaining > 0 ? (
                <span>{remaining} more to go</span>
              ) : (
                <span
                  ref={readyRef}
                  className="inline-block font-medium text-accent-700"
                >
                  Ready
                </span>
              )}
              <span className="mx-2 text-slate-300" aria-hidden="true">
                |
              </span>
              {wordCount} words · {charCount} characters
            </span>
          </div>
        </div>

        <Alert tone="error" className="mt-4">
          {error}
        </Alert>

        {submitting && (
          <Alert tone="info" className="fade-in mt-4">
            <span className="pulse-soft inline-block">
              Saving, and reading it for patterns — a few seconds.
            </span>
          </Alert>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" disabled={!canSubmit} loading={submitting} loadingText="Analysing…">
            Save entry
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Minimum {MIN_CHARS} characters.</p>
      </form>
    </div>
  );
}
