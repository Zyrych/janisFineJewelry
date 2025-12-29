import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, signOut, isSuperUser } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold font-serif">Admin Dashboard</h1>
          <button onClick={signOut} className="text-white/80 text-sm hover:text-white">
            Sign Out
          </button>
        </div>
        <p className="text-white/70 text-sm mt-1">
          Welcome, {user?.full_name}
          {isSuperUser && ' (Super User)'}
        </p>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="grid gap-3">
          <Link
            to="/admin/orders"
            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#B8956B] transition-colors"
          >
            <h2 className="font-semibold text-[#5C4A3A]">Orders</h2>
            <p className="text-sm text-[#8B7355]">View and manage orders</p>
          </Link>

          <Link
            to="/admin/payments"
            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#B8956B] transition-colors"
          >
            <h2 className="font-semibold text-[#5C4A3A]">Payments</h2>
            <p className="text-sm text-[#8B7355]">Confirm payment submissions</p>
          </Link>

          {isSuperUser && (
            <>
              <Link
                to="/admin/products"
                className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#B8956B] transition-colors"
              >
                <h2 className="font-semibold text-[#5C4A3A]">Products</h2>
                <p className="text-sm text-[#8B7355]">Manage product catalog</p>
              </Link>

              <Link
                to="/admin/users"
                className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#B8956B] transition-colors"
              >
                <h2 className="font-semibold text-[#5C4A3A]">Users</h2>
                <p className="text-sm text-[#8B7355]">Manage users and roles</p>
              </Link>
            </>
          )}
        </div>

        <Link
          to="/"
          className="block text-center text-[#B8956B] font-medium mt-6"
        >
          &larr; Back to Store
        </Link>
      </main>
    </div>
  );
}
