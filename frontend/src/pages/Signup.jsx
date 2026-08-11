import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import AuthCard from '../components/AuthCard';
import Button from '../components/Button';
import Field from '../components/Field';
import { buttonClasses } from '../lib/buttonStyles';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const emailProblem = !trimmedEmail
    ? 'Enter your email address.'
    : !EMAIL_PATTERN.test(trimmedEmail)
      ? 'That doesn’t look like an email address yet.'
      : '';
  const passwordProblem = !password
    ? 'Pick a password.'
    : password.length < MIN_PASSWORD_LENGTH
      ? `A bit longer — ${MIN_PASSWORD_LENGTH} characters minimum.`
      : '';
  const canSubmit = !emailProblem && !passwordProblem;

  // Problems are computed on every keystroke but only shown once a field has
  // been left — nobody needs to be told their email is invalid mid-typing.
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setNotice('');
    setLoading(true);
    const { data, error: signUpError } = await signUp(trimmedEmail, password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // With email confirmation enabled Supabase returns no session, so going
    // straight to /dashboard would silently bounce back to the login page.
    if (!data?.session) {
      setNotice(`Account created. Check ${trimmedEmail} for a confirmation link, then log in.`);
      return;
    }

    navigate('/dashboard');
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Three free entries, no card required."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            Log in
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
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          hint={`Use ${MIN_PASSWORD_LENGTH} characters or more.`}
          value={password}
          error={touched.password ? passwordProblem : ''}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched('password')}
        />

        <Alert tone="error">{error}</Alert>
        {/* Alert renders nothing without children, so the login shortcut only
            appears alongside the confirmation notice. */}
        <Alert
          tone="success"
          action={
            <Link
              to="/auth/login"
              className={buttonClasses({ variant: 'secondary', size: 'md' })}
            >
              Log in
            </Link>
          }
        >
          {notice}
        </Alert>

        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
          loading={loading}
          loadingText="Creating account…"
        >
          Sign up
        </Button>
      </form>
    </AuthCard>
  );
}
