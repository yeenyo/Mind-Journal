import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-calm-800">Reset your password</h1>
      {sent ? (
        <p className="mt-6 text-calm-600">Check your email for a password reset link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-calm-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-calm-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="rounded-md bg-calm-600 px-4 py-2 text-white hover:bg-calm-700">
            Send reset link
          </button>
        </form>
      )}
      <Link to="/auth/login" className="mt-4 text-sm text-calm-600 underline">
        Back to log in
      </Link>
    </div>
  );
}
