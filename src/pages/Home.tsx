import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { db } from '../lib/db';
import type { Live } from '../types';

export default function Home() {
  const { user, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const [activeLive, setActiveLive] = useState<Live | null>(null);
  const [hasLives, setHasLives] = useState(false);

  useEffect(() => {
    async function fetchLives() {
      const { data, error } = await db.query<Live[]>('lives', {
        select: '*',
      });

      if (!error && data && data.length > 0) {
        setHasLives(true);
        // Check for an active live
        const live = data.find((l) => l.status === 'live');
        if (live) {
          setActiveLive(live);
        }
      }
    }
    fetchLives();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-white">
      {/* Header */}
      <header className="bg-[#B8956B] text-white px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="text-sm">
            {user ? (
              <span>Hi, {user.full_name.split(' ')[0]}</span>
            ) : (
              <Link to="/login" className="underline">Sign In</Link>
            )}
          </div>
          <Link to="/cart" className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-[#B8956B] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 py-12 text-center max-w-lg mx-auto">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#B8956B] flex items-center justify-center shadow-lg border-4 border-[#D4AF37]">
          <div className="text-white text-center">
            <span className="text-3xl font-serif italic">J</span>
            <span className="text-xl tracking-wider">ANIS</span>
          </div>
        </div>
        <h1 className="text-2xl font-serif text-[#5C4A3A] mb-2">
          Janis Fine Jewelry
        </h1>
        <p className="text-[#B8956B] text-sm tracking-widest uppercase">
          Keep on Shining
        </p>
      </div>

      {/* Live Section */}
      {activeLive ? (
        <div className="px-4 pb-6 max-w-lg mx-auto">
          <Link
            to={`/lives/${activeLive.slug}`}
            className="block bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <div>
                  <p className="text-white font-bold text-lg">LIVE NOW</p>
                  <p className="text-white/80 text-sm truncate max-w-[180px]">{activeLive.title}</p>
                </div>
              </div>
              <div className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      ) : hasLives ? (
        <div className="px-4 pb-6 max-w-lg mx-auto">
          <Link
            to="/lives"
            className="block bg-white border-2 border-[#B8956B] rounded-xl p-4 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#B8956B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-[#5C4A3A] font-semibold">Facebook Lives</p>
                  <p className="text-[#8B7355] text-sm">Browse previous live sessions</p>
                </div>
              </div>
              <div className="text-[#B8956B]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      ) : null}

      {/* Main Actions */}
      <div className="px-4 pb-8 max-w-lg mx-auto">
        <div className="space-y-3">
          <Link
            to="/products"
            className="block w-full bg-[#B8956B] text-white text-center py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors shadow-lg"
          >
            Browse Collection
          </Link>

          {user && (
            <>
              <Link
                to="/orders"
                className="block w-full bg-white text-[#5C4A3A] text-center py-4 rounded-xl font-semibold border-2 border-[#B8956B] hover:bg-stone-50 transition-colors"
              >
                My Orders
              </Link>
              <Link
                to="/account"
                className="block w-full bg-white text-[#5C4A3A] text-center py-4 rounded-xl font-semibold border-2 border-stone-200 hover:border-[#B8956B] hover:bg-stone-50 transition-colors"
              >
                Account Details
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="block w-full bg-[#5C4A3A] text-white text-center py-4 rounded-xl font-semibold hover:bg-[#4A3C2E] transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          {user ? (
            <div className="text-center">
              <p className="text-[#8B7355] text-sm mb-3">{user.email}</p>
              <button
                onClick={signOut}
                className="text-[#B8956B] font-medium hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-white text-[#B8956B] text-center py-3 rounded-xl font-medium border border-[#B8956B] hover:bg-stone-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block text-center text-[#8B7355] font-medium hover:underline"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#8B7355] text-xs">
            Order during our Facebook Live!
          </p>
          <p className="text-[#B8956B] text-xs mt-1">
            GCash • Bank Transfer • COD
          </p>
        </div>
      </div>
    </div>
  );
}
