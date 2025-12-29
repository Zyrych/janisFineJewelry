import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { Payment, Order } from '../../types';

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface PaymentWithOrder extends Payment {
  orders: Order & { users: { full_name: string; email: string } };
}

const ALL_STATUSES = ['pending', 'confirmed', 'rejected'];

export default function AdminPayments() {
  const { user, session } = useAuth();
  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending']);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  useEffect(() => {
    async function fetchPayments() {
      if (!session?.access_token) return;

      const { data, error } = await db.query<PaymentWithOrder[]>('payments', {
        select: '*, orders(*, users(full_name, email))',
      }, session.access_token);

      if (error) {
        console.error('Failed to fetch payments:', error);
      } else {
        const sorted = (data || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPayments(sorted);
      }
      setLoading(false);
    }

    fetchPayments();
  }, [session?.access_token]);

  const updatePaymentStatus = async (paymentId: string, orderId: string, newStatus: 'confirmed' | 'rejected') => {
    if (!session?.access_token || !user) return;

    await db.update(
      'payments',
      {
        status: newStatus,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      },
      { id: paymentId },
      session.access_token
    );

    if (newStatus === 'confirmed') {
      await db.update('orders', { status: 'payment_confirmed' }, { id: orderId }, session.access_token);
    }

    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId ? { ...payment, status: newStatus } : payment
      )
    );
  };

  const filteredPayments = payments.filter((payment) => {
    // Status filter
    const statusMatch = selectedStatuses.length === ALL_STATUSES.length || selectedStatuses.includes(payment.status);

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const searchMatch =
      payment.orders?.id?.toLowerCase().includes(query) ||
      payment.orders?.users?.full_name?.toLowerCase().includes(query) ||
      payment.orders?.users?.email?.toLowerCase().includes(query) ||
      payment.payment_method?.toLowerCase().includes(query);

    return statusMatch && searchMatch;
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const selectAll = () => setSelectedStatuses(ALL_STATUSES);
  const clearAll = () => setSelectedStatuses([]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-stone-100 text-stone-700';
  };

  const getFilterLabel = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) return 'All Statuses';
    if (selectedStatuses.length === 0) return 'None Selected';
    if (selectedStatuses.length === 1) return selectedStatuses[0].charAt(0).toUpperCase() + selectedStatuses[0].slice(1);
    return `${selectedStatuses.length} Selected`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">Payments</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by order ID, name, or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-stone-200 text-[#5C4A3A] placeholder-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#5C4A3A]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-stone-200 text-[#5C4A3A] font-medium shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {getFilterLabel()}
            </span>
            <svg className={`w-5 h-5 text-[#8B7355] transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg z-20 p-3">
              <div className="flex justify-between mb-2 pb-2 border-b border-stone-100">
                <button onClick={selectAll} className="text-sm text-[#B8956B] font-medium hover:underline">
                  Select All
                </button>
                <button onClick={clearAll} className="text-sm text-[#8B7355] font-medium hover:underline">
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {ALL_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={() => setFilterOpen(false)} className="w-full mt-3 pt-2 border-t border-stone-100 text-sm text-[#5C4A3A] font-medium">
                Done
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-[#8B7355] text-sm mb-3">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        )}

        {loading ? (
          <div className="text-center text-[#8B7355] py-8">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center text-[#8B7355] py-8">No payments found</div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[#5C4A3A]">
                      Order #{payment.orders?.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[#8B7355] text-sm">
                      {payment.orders?.users?.full_name}
                    </p>
                    <p className="text-[#8B7355]/70 text-xs">{payment.payment_method}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    payment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : payment.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payment.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#B8956B]">
                    {formatPrice(payment.amount)}
                  </span>
                  <p className="text-[#8B7355] text-xs">
                    {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>

                {payment.proof_url && (
                  <button
                    onClick={async () => {
                      const res = await fetch(payment.proof_url, {
                        headers: {
                          'Authorization': `Bearer ${session?.access_token}`,
                          'apikey': SUPABASE_KEY,
                        },
                      });
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                    className="block mt-3 text-[#B8956B] text-sm font-medium underline"
                  >
                    View Payment Proof
                  </button>
                )}

                {payment.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => updatePaymentStatus(payment.id, payment.order_id, 'confirmed')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updatePaymentStatus(payment.id, payment.order_id, 'rejected')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
