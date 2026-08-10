import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' };

export default function Settings() {
  const { user, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setTier(data?.subscription_tier ?? 'free'));
  }, [user.id]);

  async function handleUpgrade(plan) {
    setError('');
    setBusy(true);
    try {
      const { url } = await api.createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleCancel() {
    setError('');
    setBusy(true);
    try {
      await api.cancelSubscription();
      setMessage('Subscription will end at the current billing period.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const { error: updateError } = await updatePassword(newPassword);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNewPassword('');
    setMessage('Password updated.');
  }

  async function handleExport() {
    const blob = await api.exportData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindjournal-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!window.confirm('This permanently deletes your account and all entries. Continue?')) return;
    setBusy(true);
    try {
      await api.deleteAccount();
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-calm-800">Settings</h1>

      {message && <p className="mt-4 rounded-md bg-calm-100 p-3 text-sm text-calm-700">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="mt-6 rounded-lg border border-calm-200 bg-white p-5">
        <h2 className="font-medium text-calm-800">Subscription</h2>
        <p className="mt-1 text-calm-600">
          Current plan: <span className="font-semibold">{tier ? PLAN_LABELS[tier] : '…'}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {tier === 'free' && (
            <>
              <button
                disabled={busy}
                onClick={() => handleUpgrade('pro')}
                className="rounded-md bg-calm-600 px-4 py-2 text-white hover:bg-calm-700 disabled:opacity-60"
              >
                Upgrade to Pro
              </button>
              <button
                disabled={busy}
                onClick={() => handleUpgrade('premium')}
                className="rounded-md border border-calm-300 px-4 py-2 text-calm-700 hover:bg-calm-100 disabled:opacity-60"
              >
                Upgrade to Premium
              </button>
            </>
          )}
          {tier !== 'free' && (
            <button
              disabled={busy}
              onClick={handleCancel}
              className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Cancel subscription
            </button>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-calm-200 bg-white p-5">
        <h2 className="font-medium text-calm-800">Change password</h2>
        <form onSubmit={handlePasswordChange} className="mt-3 flex gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="flex-1 rounded-md border border-calm-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-calm-400"
          />
          <button type="submit" className="rounded-md bg-calm-600 px-4 py-2 text-white hover:bg-calm-700">
            Update
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-calm-200 bg-white p-5">
        <h2 className="font-medium text-calm-800">Your data</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="rounded-md border border-calm-300 px-4 py-2 text-calm-700 hover:bg-calm-100"
          >
            Export data (CSV)
          </button>
          <button onClick={signOut} className="rounded-md border border-calm-300 px-4 py-2 text-calm-700 hover:bg-calm-100">
            Log out
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-red-200 bg-white p-5">
        <h2 className="font-medium text-red-700">Danger zone</h2>
        <button
          disabled={busy}
          onClick={handleDeleteAccount}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete account
        </button>
      </section>
    </div>
  );
}
