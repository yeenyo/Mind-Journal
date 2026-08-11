import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { api } from '../lib/api';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import Field from '../components/Field';
import { DownloadIcon, LockIcon } from '../components/Icons';
import PlanBadge from '../components/PlanBadge';
import SuccessFlash from '../components/SuccessFlash';
import { buttonClasses } from '../lib/buttonStyles';

const MIN_PASSWORD_LENGTH = 6;

// Prices shown on the upgrade buttons must match the Stripe Price objects the
// backend charges against (see STRIPE_PRICE_ID_* in backend/.env).
const PLAN_COPY = {
  free: 'Unlimited writing. No AI analysis.',
  pro: 'Unlimited writing, ADHD analysis on every entry, weekly patterns, printable report.',
  premium: 'Everything in Pro, plus task breakdowns, check-ins, and your strategy library.',
};

export default function Settings() {
  const { updatePassword, signOut } = useAuth();
  const { tier, loading: tierLoading, error: tierError, refresh: refreshTier } = useProfile();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordFlash, setPasswordFlash] = useState('');
  const [exporting, setExporting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [breakdowns, setBreakdowns] = useState([]);

  const isPaid = tier === 'pro' || tier === 'premium';
  const isPremium = tier === 'premium';
  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH;

  useEffect(() => {
    if (!isPremium) return;
    api
      .getBreakdowns()
      .then(setBreakdowns)
      .catch(() => setBreakdowns([]));
  }, [isPremium]);

  // Stable identity so SuccessFlash's dismiss timer isn't restarted by every
  // unrelated re-render of this page.
  const clearPasswordFlash = useCallback(() => setPasswordFlash(''), []);

  function reset() {
    setError('');
    setMessage('');
  }

  async function handleUpgrade(plan) {
    reset();
    setCheckoutBusy(plan);
    try {
      const { url } = await api.createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setCheckoutBusy('');
    }
  }

  async function handleCancel() {
    setCancelBusy(true);
    try {
      await api.cancelSubscription();
      reset();
      setMessage('Your subscription will end at the close of the current billing period.');
      await refreshTier();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelBusy(false);
      setCancelOpen(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    reset();
    setPasswordError('');
    if (!passwordValid) {
      setPasswordError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setPasswordBusy(true);
    const { error: updateError } = await updatePassword(newPassword);
    setPasswordBusy(false);
    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }
    setNewPassword('');
    setPasswordFlash('Password updated.');
  }

  async function handleExport() {
    reset();
    setExporting(true);
    try {
      const blob = await api.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindjournal-export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Export downloaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    try {
      await api.deleteAccount();
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Settings</h1>

      <div className="mt-5 flex flex-col gap-3">
        <Alert tone="success">{message}</Alert>
        <Alert tone="error">{error}</Alert>
        <Alert
          tone="error"
          action={
            <Button size="sm" variant="secondary" onClick={refreshTier}>
              Try again
            </Button>
          }
        >
          {tierError ? `We couldn’t read your plan: ${tierError}` : ''}
        </Alert>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <Card>
          <CardHeader title="Your plan" />
          <div className="flex flex-wrap items-center gap-3">
            <PlanBadge tier={tier} loading={tierLoading} />
            {!tierLoading && (
              <span className="min-w-0 text-sm text-gray-600">{PLAN_COPY[tier ?? 'free']}</span>
            )}
          </div>

          {!tierLoading && !isPaid && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => handleUpgrade('pro')}
                loading={checkoutBusy === 'pro'}
                loadingText="Opening checkout…"
                disabled={Boolean(checkoutBusy)}
              >
                Get Pro — £9.99/mo
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleUpgrade('premium')}
                loading={checkoutBusy === 'premium'}
                loadingText="Opening checkout…"
                disabled={Boolean(checkoutBusy)}
              >
                Get Premium — £24.99/mo
              </Button>
            </div>
          )}

          {/* No direct plan switch on purpose: every checkout creates a NEW Stripe
              subscription, so upgrading while one is live would bill twice. Cancel
              first, then resubscribe. */}
          {!tierLoading && isPaid && (
            <div className="mt-5">
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                Cancel subscription
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                To move between Pro and Premium, cancel here first and then resubscribe — that keeps
                you on a single subscription instead of being charged for two.
              </p>
            </div>
          )}
        </Card>

        {isPremium && (
          <>
            <Card>
              <CardHeader
                title="Task breakdowns"
                hint="Every breakdown you’ve asked for, kept so you can pick one back up."
              />
              {breakdowns.length ? (
                <>
                  <ul className="flex flex-col gap-2.5">
                    {breakdowns.slice(0, 5).map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                      >
                        <span className="min-w-0 truncate text-gray-800">{item.task}</span>
                        <span className="shrink-0 text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()} · {item.steps.length} steps
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/breakdown"
                    className={`mt-4 ${buttonClasses({ variant: 'secondary', size: 'sm' })}`}
                  >
                    Break down something new
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Nothing broken down yet.</p>
                  <Link to="/breakdown" className={`mt-4 ${buttonClasses({ size: 'sm' })}`}>
                    Break down a task
                  </Link>
                </>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Weekly accountability check-in"
                hint="A short email about the goals you wrote down. Reply with one word."
              />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                Not sending yet
              </span>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Check-in emails aren’t going out — this app has no email delivery or scheduler
                connected yet, so nothing is queued for you. Nothing to set up, and nothing you’ve
                missed.
              </p>
            </Card>
          </>
        )}

        <Card>
          <CardHeader title="Account" hint="You’ll stay logged in on this device." />
          <SuccessFlash message={passwordFlash} onDone={clearPasswordFlash} />
          <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col gap-4 sm:max-w-sm">
            <Field
              label="New password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              hint={`${MIN_PASSWORD_LENGTH} characters minimum.`}
              error={passwordError}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              disabled={passwordBusy}
            />
            <Button
              type="submit"
              className="sm:self-start"
              disabled={!passwordValid}
              loading={passwordBusy}
              loadingText="Updating…"
            >
              Update password
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Your data" hint="Take it with you, or wipe it, whenever you want." />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              loadingText="Preparing…"
            >
              <DownloadIcon className="h-4 w-4" />
              Export entries (CSV)
            </Button>
            {isPaid && (
              <Link to="/report" className={buttonClasses({ variant: 'secondary' })}>
                Printable report
              </Link>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-red-700">Delete account</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Removes your account, every entry, and every analysis straight away. It can’t be
              undone — export first if you want to keep a copy.
            </p>
            <Button variant="dangerSolid" className="mt-4" onClick={() => setDeleteOpen(true)}>
              Delete account
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-gray-400" />
                Privacy
              </span>
            }
            hint="Your entries are analysed by Anthropic's Claude API. Never sold."
          />
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-gray-600">
            <li>
              Analysis runs on Anthropic’s Claude API, under terms that keep your entries out of
              model training.
            </li>
            <li>
              Entries are stored in your account so you can read them back later, and they’re
              encrypted at rest by our database host.
            </li>
            <li>
              We never sell your data and we never use your entries to train anything. Export or
              delete the lot whenever you want.
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Button variant="secondary" onClick={signOut} className="w-full sm:w-auto">
          Log out
        </Button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel your subscription?"
        body="You’ll keep access until the end of the current billing period, then move back to the Free plan. Your entries stay."
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
        busy={cancelBusy}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        body="This permanently deletes your account, every journal entry, and all analysis. This cannot be undone."
        confirmLabel="Delete everything"
        cancelLabel="Keep my account"
        busy={deleteBusy}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
