import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export default function Insights() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api
      .getInsights(range)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [range]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-calm-800">Your Patterns</h1>

      <div className="mt-4 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              range === r.value ? 'bg-calm-600 text-white' : 'border border-calm-300 text-calm-700 hover:bg-calm-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!data && !error && <p className="mt-4 text-calm-500">Loading…</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-calm-200 bg-white p-4">
              <p className="text-xs text-calm-500">Total entries</p>
              <p className="mt-1 text-xl font-semibold text-calm-800">{data.totalEntries}</p>
            </div>
            <div className="rounded-lg border border-calm-200 bg-white p-4">
              <p className="text-xs text-calm-500">Most common theme</p>
              <p className="mt-1 text-xl font-semibold text-calm-800">{data.mostCommonTheme ?? '—'}</p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-medium text-calm-800">Themes</h2>
          {!data.themes.length && <p className="mt-2 text-calm-500">No themes detected yet in this range.</p>}
          <ul className="mt-3 flex flex-col gap-2">
            {data.themes.map((t) => (
              <li
                key={t.theme}
                className="flex items-center justify-between rounded-md border border-calm-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-calm-800">{t.theme}</p>
                  <p className="text-xs text-calm-500">First seen {new Date(t.firstSeen).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-calm-200 px-3 py-1 text-sm text-calm-800">
                  {t.frequency}×
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
