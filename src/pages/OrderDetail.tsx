import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import type { Order, OrderItem, Product, Payment } from '../types';

interface OrderItemWithProduct extends OrderItem {
  products: Product;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const { data: paymentsData } = await db.query<Payment[]>('payments', {
        select: '*',
        eq: { order_id: orderId },
      }, session.access_token);

      if (paymentsData) {
        setPayments(paymentsData);
      }

      setLoading(false);
    }

    fetchOrder();
  }, [orderId, session?.access_token]);

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order || !session?.access_token) return;

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.id}-${Date.now()}.${fileExt}`;

      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/payment-proofs/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': file.type,
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Upload failed:', errorText);
        throw new Error('Failed to upload file');
      }

      // Get signed URL for private bucket (valid for 1 year)
      const proofUrl = `${SUPABASE_URL}/storage/v1/object/payment-proofs/${fileName}`;

      // Create payment record
      const { error: paymentError } = await db.insert(
        'payments',
        {
          order_id: order.id,
          amount: order.total_amount,
          payment_method: paymentMethod,
          proof_url: proofUrl,
          status: 'pending',
        },
        session.access_token
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Update order status
      await db.update(
        'orders',
        { status: 'payment_submitted' },
        { id: order.id },
        session.access_token
      );

      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
        <Link to="/orders" className="block text-center text-[#B8956B] mt-4 font-medium">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/orders" className="text-[#B8956B] font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Order Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#5C4A3A] font-medium">
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

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Items</h2>
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

        {payments.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-[#5C4A3A] mb-3">Payment Submissions</h2>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-stone-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#5C4A3A] text-sm">
                        {payment.payment_method}
                      </p>
                      <p className="text-[#8B7355] text-xs">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
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
                      className="text-[#B8956B] text-sm font-medium underline mt-2 inline-block"
                    >
                      View Proof
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(order.status === 'awaiting_payment' || order.status === 'pending') && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-[#5C4A3A] mb-3">Submit Payment Proof</h2>

            <div className="mb-3">
              <label className="block text-sm text-[#5C4A3A] font-medium mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              >
                <option value="GCash">GCash</option>
                <option value="BDO">BDO Bank Transfer</option>
                <option value="BPI">BPI Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadProof}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-[#B8956B] text-white py-3 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors disabled:opacity-50 shadow-lg"
            >
              {uploading ? 'Uploading...' : 'Upload Payment Screenshot'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
