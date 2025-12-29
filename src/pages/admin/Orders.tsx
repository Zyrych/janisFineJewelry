import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { Order } from '../../types';

interface OrderWithUser extends Order {
  users: { full_name: string; email: string };
}

const ALL_STATUSES = [
  'pending',
  'awaiting_payment',
  'payment_submitted',
  'payment_confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUSES);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-stone-100 text-stone-700',
      awaiting_payment: 'bg-amber-100 text-amber-700',
      payment_submitted: 'bg-blue-100 text-blue-700',
      payment_confirmed: 'bg-green-100 text-green-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-stone-100 text-stone-700';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    async function fetchOrders() {
      if (!session?.access_token) return;

      const { data, error } = await db.query<OrderWithUser[]>('orders', {
        select: '*, users(full_name, email)',
      }, session.access_token);

      if (error) {
        console.error('Failed to fetch orders:', error);
      } else {
        const sorted = (data || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [session?.access_token]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!session?.access_token) return;

    await db.update('orders', { status: newStatus }, { id: orderId }, session.access_token);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      )
    );
  };

  const filteredOrders = orders.filter((order) => {
    // Status filter
    const statusMatch = selectedStatuses.length === ALL_STATUSES.length || selectedStatuses.includes(order.status);

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const searchMatch =
      order.id.toLowerCase().includes(query) ||
      order.users?.full_name?.toLowerCase().includes(query) ||
      order.users?.email?.toLowerCase().includes(query);

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

  const getFilterLabel = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) return 'All Statuses';
    if (selectedStatuses.length === 0) return 'None Selected';
    if (selectedStatuses.length === 1) return formatStatus(selectedStatuses[0]);
    return `${selectedStatuses.length} Selected`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">Orders</h1>
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
              placeholder="Search by order ID, name, or email..."
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
                <button
                  onClick={selectAll}
                  className="text-sm text-[#B8956B] font-medium hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-[#8B7355] font-medium hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {ALL_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
                      {formatStatus(status)}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full mt-3 pt-2 border-t border-stone-100 text-sm text-[#5C4A3A] font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-[#8B7355] text-sm mb-3">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        )}

        {loading ? (
          <div className="text-center text-[#8B7355] py-8">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-[#8B7355] py-8">No orders found</div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[#5C4A3A]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[#8B7355] text-sm">{order.users?.full_name}</p>
                    <p className="text-[#8B7355]/70 text-xs">{order.users?.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-[#B8956B]">
                    {formatPrice(order.total_amount)}
                  </span>
                  <p className="text-[#8B7355] text-xs">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="payment_submitted">Payment Submitted</option>
                    <option value="payment_confirmed">Payment Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
