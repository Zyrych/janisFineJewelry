import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Home() {
  const { user, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();

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
