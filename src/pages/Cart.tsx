import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/products" className="text-[#B8956B] font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Cart</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {items.length === 0 ? (
          <div className="text-center text-[#8B7355] py-12">
            <p>Your cart is empty</p>
            <Link
              to="/products"
              className="inline-block mt-4 text-[#B8956B] font-medium underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#5C4A3A] text-sm">
                      {item.product.name}
                    </h3>
                    <p className="text-[#B8956B] font-bold text-sm">
                      {formatPrice(item.product.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-full bg-stone-200 text-[#5C4A3A] flex items-center justify-center font-medium"
                      >
                        -
                      </button>
                      <span className="text-[#5C4A3A] font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-full bg-stone-200 text-[#5C4A3A] flex items-center justify-center font-medium"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between text-lg font-bold text-[#5C4A3A]">
                <span>Total</span>
                <span className="text-[#B8956B]">{formatPrice(totalAmount)}</span>
              </div>

              {user ? (
                <Link
                  to="/checkout"
                  className="block w-full bg-[#B8956B] text-white text-center py-4 rounded-xl font-semibold mt-4 hover:bg-[#A6845D] transition-colors shadow-lg"
                >
                  Proceed to Checkout
                </Link>
              ) : (
                <div className="mt-4">
                  <p className="text-center text-[#8B7355] text-sm mb-3">
                    Please sign in to checkout
                  </p>
                  <Link
                    to="/login"
                    className="block w-full bg-[#B8956B] text-white text-center py-3 rounded-xl font-semibold hover:bg-[#A6845D] transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
