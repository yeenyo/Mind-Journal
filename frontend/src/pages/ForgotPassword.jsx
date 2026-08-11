import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import AuthCard from '../components/AuthCard';
import Button from '../components/Button';
import Field from '../components/Field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const emailProblem = !trimmedEmail
    ? 'Enter your email address.'
    : !EMAIL_PATTERN.test(trimmedEmail)
      ? 'That doesn’t look like an email address yet.'
      : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (emailProblem) return;
    setError('');
    setLoading(true);
    const { error: resetError } = await resetPassword(trimmedEmail);
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle={sent ? undefined : 'We’ll email you a link to choose a new one.'}
      footer={
        <Link
          to="/auth/login"
          className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">
          If an account exists for {trimmedEmail}, a reset link is on its way. The link expires in
          one hour.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            hint="Use the address you signed up with."
            value={email}
            error={touched ? emailProblem : ''}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />

          <Alert tone="error">{error}</Alert>

          <Button
            type="submit"
            fullWidth
            disabled={Boolean(emailProblem)}
            loading={loading}
            loadingText="Sending…"
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
