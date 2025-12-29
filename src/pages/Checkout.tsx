import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/db';

type PaymentMethod = 'online' | 'cod';

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  const handlePlaceOrder = async () => {
    if (!user || !session?.access_token) return;

    setLoading(true);
    setError('');

    try {
      const orderStatus = paymentMethod === 'cod' ? 'processing' : 'awaiting_payment';
      const orderNotes = paymentMethod === 'cod'
        ? `[COD] ${notes || ''}`.trim()
        : notes || null;

      const { data: order, error: orderError } = await db.insert<{ id: string }>(
        'orders',
        {
          user_id: user.id,
          status: orderStatus,
          total_amount: totalAmount,
          notes: orderNotes,
        },
        session.access_token
      );

      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      for (const item of items) {
        const { error: itemError } = await db.insert(
          'order_items',
          {
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
          },
          session.access_token
        );

        if (itemError) {
          console.error('Failed to create order item:', itemError);
        }
      }

      clearCart();
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8">
        <div className="text-center text-[#8B7355]">
          <p>Your cart is empty</p>
          <Link to="/products" className="text-[#B8956B] underline mt-2 inline-block">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Link to="/cart" className="text-[#B8956B]">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Checkout</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-[#8B7355]">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="text-[#5C4A3A] font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-semibold text-[#5C4A3A]">
            <span>Total</span>
            <span className="text-[#B8956B]">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Delivery Information</h2>
          <div className="text-sm">
            <p className="text-[#5C4A3A] font-medium">{user?.full_name}</p>
            <p className="text-[#8B7355]">{user?.email}</p>
            {user?.phone && <p className="text-[#8B7355]">{user.phone}</p>}
            {user?.address && <p className="text-[#8B7355] mt-1">{user.address}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-[#5C4A3A] mb-3">Payment Method</h2>
          <div className="space-y-2">
            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              paymentMethod === 'online'
                ? 'border-[#B8956B] bg-[#B8956B]/5'
                : 'border-stone-200'
            }`}>
              <input
                type="radio"
                name="payment"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'online' ? 'border-[#B8956B]' : 'border-stone-300'
              }`}>
                {paymentMethod === 'online' && (
                  <div className="w-3 h-3 rounded-full bg-[#B8956B]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#5C4A3A]">Online Payment</p>
                <p className="text-xs text-[#8B7355]">GCash, Bank Transfer</p>
              </div>
            </label>

            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              paymentMethod === 'cod'
                ? 'border-[#B8956B] bg-[#B8956B]/5'
                : 'border-stone-200'
            }`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'cod' ? 'border-[#B8956B]' : 'border-stone-300'
              }`}>
                {paymentMethod === 'cod' && (
                  <div className="w-3 h-3 rounded-full bg-[#B8956B]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#5C4A3A]">Cash on Delivery</p>
                <p className="text-xs text-[#8B7355]">Pay when you receive</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <label className="block font-semibold text-[#5C4A3A] mb-2">
            Order Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions, delivery address details..."
            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#B8956B] resize-none text-sm"
            rows={3}
          />
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-[#B8956B] text-white py-4 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors disabled:opacity-50 shadow-lg"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>

        <p className="text-center text-[#8B7355] text-xs mt-4">
          {paymentMethod === 'cod'
            ? "You'll pay when your order is delivered."
            : "After placing your order, you'll receive payment instructions."
          }
        </p>
      </main>
    </div>
  );
}
