import { supabase } from './supabase';

// In production the frontend and backend are one Vercel project on one domain
// (see /vercel.json — /api/* rewrites to the backend service), so the correct
// default there is '' — a same-origin relative request, not a cross-origin
// call to anything. The localhost fallback only makes sense in Vite's own dev
// server, where the backend really does run separately on its own port.
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

const OFFLINE_MESSAGE = 'Check your connection — we couldn’t reach the server.';

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
        ...options.headers,
      },
    });
  } catch {
    // fetch only rejects on network-level failure (server down, DNS, offline).
    // Anything else is an HTTP status, handled below.
    throw new Error(OFFLINE_MESSAGE);
  }

  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return body;
}

export const api = {
  getEntries: () => request('/entries'),
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (content) => request('/entries', { method: 'POST', body: JSON.stringify({ content }) }),
  // Re-runs analysis for an entry that saved but whose analysis failed.
  analyzeEntry: (id) => request(`/entries/${id}/analyze`, { method: 'POST' }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  getInsights: (range) => request(`/insights?range=${range}`),
  getBreakdowns: () => request('/breakdown'),
  createBreakdown: (task) => request('/breakdown', { method: 'POST', body: JSON.stringify({ task }) }),
  // `done` is an array of booleans positionally matching the breakdown's steps.
  // The server keeps ownership of the step text — see routes/breakdown.js.
  updateBreakdownProgress: (id, done) =>
    request(`/breakdown/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  createCheckoutSession: (plan) =>
    request('/stripe/checkout-session', { method: 'POST', body: JSON.stringify({ plan }) }),
  cancelSubscription: () => request('/stripe/cancel-subscription', { method: 'POST' }),
  exportData: async () => {
    let res;
    try {
      res = await fetch(`${API_URL}/api/account/export`, { headers: await authHeader() });
    } catch {
      throw new Error(OFFLINE_MESSAGE);
    }
    // Without this the caller happily "downloads" an error payload as CSV.
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `Export failed with status ${res.status}`);
    }
    return res.blob();
  },
  deleteAccount: () => request('/account', { method: 'DELETE' }),
};
