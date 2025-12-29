import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-100 to-white px-4 py-8">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-[#5C4A3A] mb-4">Check Your Email</h1>
          <p className="text-[#8B7355] mb-6">
            We've sent a confirmation link to <strong>{email}</strong>. Please click the link to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#B8956B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Link to="/" className="text-[#B8956B] mb-6 inline-block font-medium">
          &larr; Back
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#B8956B] flex items-center justify-center border-2 border-[#D4AF37]">
            <span className="text-white text-2xl font-serif italic">J</span>
          </div>
          <h1 className="text-2xl font-serif text-[#5C4A3A]">Create Account</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B8956B] text-white py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[#8B7355] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#B8956B] underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
