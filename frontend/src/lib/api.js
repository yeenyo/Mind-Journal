import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

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
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  getInsights: (range) => request(`/insights?range=${range}`),
  createCheckoutSession: (plan) =>
    request('/stripe/checkout-session', { method: 'POST', body: JSON.stringify({ plan }) }),
  cancelSubscription: () => request('/stripe/cancel-subscription', { method: 'POST' }),
  exportData: async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`${API_URL}/api/account/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.blob();
  },
  deleteAccount: () => request('/account', { method: 'DELETE' }),
};
