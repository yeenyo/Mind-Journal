import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import AuthCard from '../components/AuthCard';
import Button from '../components/Button';
import Field from '../components/Field';

const MIN_PASSWORD_LENGTH = 6;

// Reached via the emailed link — Supabase puts a recovery session in place
// automatically, so this page just collects the new password.
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordProblem = !password
    ? 'Pick a new password.'
    : password.length < MIN_PASSWORD_LENGTH
      ? `A bit longer — ${MIN_PASSWORD_LENGTH} characters minimum.`
      : '';
  const confirmProblem = !confirm
    ? 'Type it once more.'
    : confirm !== password
      ? 'These two don’t match yet.'
      : '';
  const canSubmit = !passwordProblem && !confirmProblem;

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="You’ll be signed in once it’s saved."
      footer={
        <Link
          to="/auth/login"
          className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="New password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          hint={`Use ${MIN_PASSWORD_LENGTH} characters or more.`}
          value={password}
          error={touched.password ? passwordProblem : ''}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched('password')}
        />
        <Field
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your new password"
          value={confirm}
          error={touched.confirm ? confirmProblem : ''}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => markTouched('confirm')}
        />

        <Alert tone="error">{error}</Alert>

        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
          loading={loading}
          loadingText="Saving…"
        >
          Save password
        </Button>
      </form>
    </AuthCard>
  );
}
