import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const DRAFT_KEY = 'mindjournal:draft';
const MIN_CHARS = 50;

export default function NewEntry() {
  const navigate = useNavigate();
  const [content, setContent] = useState(() => localStorage.getItem(DRAFT_KEY) ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (charCount < MIN_CHARS) {
      setError(`Write at least ${MIN_CHARS} characters (currently ${charCount}).`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.createEntry(content);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-calm-800">New entry</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="What's on your mind today?"
          className="rounded-md border border-calm-300 p-4 leading-relaxed focus:outline-none focus:ring-2 focus:ring-calm-400"
        />
        <div className="flex justify-between text-xs text-calm-500">
          <span>
            {wordCount} words · {charCount} characters
          </span>
          {savedAt && <span>Draft saved {savedAt.toLocaleTimeString()}</span>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-calm-600 px-4 py-2 text-white hover:bg-calm-700 disabled:opacity-60"
          >
            {submitting ? 'Analyzing…' : 'Submit entry'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded-md border border-calm-300 px-4 py-2 text-calm-700 hover:bg-calm-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
