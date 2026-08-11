import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import AuthCard from '../components/AuthCard';
import Button from '../components/Button';
import Field from '../components/Field';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const emailProblem = !trimmedEmail
    ? 'Enter your email address.'
    : !EMAIL_PATTERN.test(trimmedEmail)
      ? 'That doesn’t look like an email address yet.'
      : '';
  const passwordProblem = !password
    ? 'Enter your password.'
    : password.length < MIN_PASSWORD_LENGTH
      ? `Passwords here are at least ${MIN_PASSWORD_LENGTH} characters — check for a typo.`
      : '';
  const canSubmit = !emailProblem && !passwordProblem;

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(trimmedEmail, password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Pick up where you left off."
      footer={
        <>
          New to MindJournal?{' '}
          <Link
            to="/auth/signup"
            className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={touched.email ? emailProblem : ''}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched('email')}
        />
        <Field
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          error={touched.password ? passwordProblem : ''}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched('password')}
        />

        <Alert tone="error">{error}</Alert>

        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
          loading={loading}
          loadingText="Logging in…"
        >
          Log in
        </Button>

        <Link
          to="/auth/forgot-password"
          className="self-center text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthCard>
  );
}
