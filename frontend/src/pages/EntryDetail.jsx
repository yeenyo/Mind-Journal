import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .getEntry(id)
      .then(setEntry)
      .catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteEntry(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (error) return <p className="mx-auto max-w-2xl px-6 py-10 text-red-600">{error}</p>;
  if (!entry) return <p className="mx-auto max-w-2xl px-6 py-10 text-calm-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-calm-600 underline">
        ← Back to dashboard
      </Link>

      <p className="mt-4 text-sm text-calm-500">
        {new Date(entry.created_at).toLocaleString()} · {entry.word_count} words
      </p>
      <p className="mt-2 whitespace-pre-wrap text-calm-800">{entry.content}</p>

      {entry.insight && (
        <div className="mt-6 rounded-lg border border-calm-200 bg-calm-50 p-4">
          <h2 className="font-medium text-calm-800">Themes</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.insight.themes.map((theme) => (
              <span key={theme} className="rounded-full bg-calm-200 px-3 py-1 text-xs text-calm-800">
                {theme}
              </span>
            ))}
          </div>
          {entry.insight.analysis_text && (
            <p className="mt-3 text-sm text-calm-700">{entry.insight.analysis_text}</p>
          )}
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="mt-8 rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? 'Deleting…' : 'Delete entry'}
      </button>
    </div>
  );
}
