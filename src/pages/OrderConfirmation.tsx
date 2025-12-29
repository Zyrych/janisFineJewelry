import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import type { Order, OrderItem, Product } from '../types';

interface OrderItemWithProduct extends OrderItem {
  products: Product;
}

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || !session?.access_token) return;

      const { data: orderData } = await db.query<Order>('orders', {
        select: '*',
        eq: { id: orderId },
        single: true,
      }, session.access_token);

      if (orderData) {
        setOrder(orderData);
      }

      const { data: itemsData } = await db.query<OrderItemWithProduct[]>(
        'order_items',
        {
          select: '*, products(*)',
          eq: { order_id: orderId },
        },
        session.access_token
      );

      if (itemsData) {
        setOrderItems(itemsData);
      }

      setLoading(false);
    }

    fetchOrder();
  }, [orderId, session?.access_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-[#8B7355]">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8">
        <p className="text-center text-red-600">Order not found</p>
        <Link to="/" className="block text-center text-[#B8956B] mt-4 font-medium">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#B8956B] to-[#D4AF37] text-white px-4 py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-serif font-semibold">Order Placed!</h1>
        <p className="text-white/80 text-sm mt-1">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Payment Instructions</h2>
          <p className="text-[#8B7355] text-sm mb-3">
            Please send your payment to one of the following:
          </p>
          <div className="space-y-2 text-sm">
            <div className="bg-stone-50 rounded-lg p-3">
              <p className="font-medium text-[#5C4A3A]">GCash</p>
              <p className="text-[#8B7355]">0917-XXX-XXXX</p>
              <p className="text-[#B8956B] text-xs">Janis Fine Jewelry</p>
            </div>
            <div className="bg-stone-50 rounded-lg p-3">
              <p className="font-medium text-[#5C4A3A]">BDO</p>
              <p className="text-[#8B7355]">1234-5678-9012</p>
              <p className="text-[#B8956B] text-xs">Janis Fine Jewelry</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[#B8956B]/10 rounded-lg border border-[#B8956B]/20">
            <p className="text-[#5C4A3A] text-sm font-bold">
              Amount to pay: <span className="text-[#B8956B]">{formatPrice(order.total_amount)}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Order Items</h2>
          <div className="space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[#8B7355]">
                  {item.products?.name || 'Product'} x {item.quantity}
                </span>
                <span className="text-[#5C4A3A] font-medium">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between font-bold text-[#5C4A3A]">
            <span>Total</span>
            <span className="text-[#B8956B]">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        <Link
          to={`/orders/${order.id}`}
          className="block w-full bg-[#B8956B] text-white text-center py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors shadow-lg"
        >
          Upload Payment Proof
        </Link>

        <Link
          to="/orders"
          className="block text-center text-[#B8956B] font-medium mt-4"
        >
          View All Orders
        </Link>
      </main>
    </div>
  );
}
