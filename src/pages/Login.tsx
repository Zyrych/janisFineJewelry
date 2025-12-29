import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-serif text-[#5C4A3A]">Welcome Back</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B8956B] text-white py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[#8B7355] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[#B8956B] underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
