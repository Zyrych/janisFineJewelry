import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import type { Order } from '../types';

export default function Orders() {
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (!user || !session?.access_token) return;

      const { data, error } = await db.query<Order[]>('orders', {
        select: '*',
        eq: { user_id: user.id },
      }, session.access_token);

      if (error) {
        console.error('Failed to fetch orders:', error);
      } else {
        // Sort by created_at descending
        const sorted = (data || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [user, session?.access_token]);

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8">
        <p className="text-center text-[#8B7355]">
          Please <Link to="/login" className="underline text-[#B8956B]">sign in</Link> to view your orders.
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
          <h1 className="text-lg font-semibold text-[#5C4A3A]">My Orders</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center text-[#8B7355] py-12">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-[#8B7355] py-12">
            <p>You haven't placed any orders yet.</p>
            <Link
              to="/products"
              className="inline-block mt-4 text-[#B8956B] font-medium underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#5C4A3A]">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[#8B7355] text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[#B8956B] font-bold">
                    {formatPrice(order.total_amount)}
                  </span>
                  <span className="text-[#B8956B] text-sm font-medium">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
