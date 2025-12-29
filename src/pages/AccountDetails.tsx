import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/db';

export default function AccountDetails() {
  const { user, session, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    facebook_link: '',
    facebook_name: '',
    birthday: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        facebook_link: user.facebook_link || '',
        facebook_name: user.facebook_name || '',
        birthday: user.birthday || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session?.access_token) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await db.update(
        'users',
        {
          full_name: formData.full_name,
          phone: formData.phone || null,
          facebook_link: formData.facebook_link || null,
          facebook_name: formData.facebook_name || null,
          birthday: formData.birthday || null,
          address: formData.address || null,
        },
        { id: user.id },
        session.access_token
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8">
        <p className="text-center text-[#8B7355]">
          Please <Link to="/login" className="underline text-[#B8956B]">sign in</Link> to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/" className="text-[#B8956B] font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Account Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#B8956B] flex items-center justify-center">
              <span className="text-white text-2xl font-serif">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-[#8B7355] text-sm">{user.email}</p>
          </div>

          <p className="text-[#8B7355] text-sm mb-4 text-center">
            Complete your profile for smoother orders and verifications. All fields are optional.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., 0917-123-4567"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Facebook Account Name
              </label>
              <input
                type="text"
                value={formData.facebook_name}
                onChange={(e) => setFormData({ ...formData, facebook_name: e.target.value })}
                placeholder="Your Facebook display name"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              />
              <p className="text-[#8B7355] text-xs mt-1">
                Helps us find you during FB Live orders
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Facebook Profile Link
              </label>
              <input
                type="url"
                value={formData.facebook_link}
                onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                placeholder="https://facebook.com/yourprofile"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              />
              <p className="text-[#8B7355] text-xs mt-1">
                We might have a birthday surprise for you!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
                Delivery Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House/Unit No., Street, Barangay, City, Province, ZIP Code"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent resize-none"
              />
              <p className="text-[#8B7355] text-xs mt-1">
                Complete address for COD and deliveries
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B8956B] text-white py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
