import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getEntries()
      .then((data) => setEntries(data.slice(0, 10)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-calm-800">
        {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
      </h1>

      <div className="mt-6 flex gap-3">
        <Link to="/entry/new" className="rounded-md bg-calm-600 px-4 py-2 text-white hover:bg-calm-700">
          Write new entry
        </Link>
        <Link to="/insights" className="rounded-md border border-calm-300 px-4 py-2 text-calm-700 hover:bg-calm-100">
          View insights
        </Link>
      </div>

      <h2 className="mt-10 text-lg font-medium text-calm-800">Recent entries</h2>
      {loading && <p className="mt-2 text-calm-500">Loading…</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {!loading && !entries.length && <p className="mt-2 text-calm-500">No entries yet. Write your first one.</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              to={`/entry/${entry.id}`}
              className="block rounded-md border border-calm-200 bg-white p-4 hover:bg-calm-50"
            >
              <p className="text-sm text-calm-500">{new Date(entry.created_at).toLocaleString()}</p>
              <p className="mt-1 truncate text-calm-800">{entry.content}</p>
              <p className="mt-1 text-xs text-calm-500">{entry.word_count} words</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
