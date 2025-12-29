import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../types';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, totalItems } = useCart();
  const [added, setAdded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      const { data, error } = await db.query<Product[]>('products', {
        select: '*',
        eq: { id: productId },
      });

      if (error) {
        setError('Failed to load product');
        console.error(error);
      } else if (data && data.length > 0) {
        setProduct(data[0]);
      } else {
        setError('Product not found');
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-[#8B7355]">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Link to="/products" className="text-[#B8956B] font-medium">
              &larr; Back
            </Link>
            <h1 className="text-lg font-semibold text-[#5C4A3A]">Product</h1>
            <div className="w-12" />
          </div>
        </header>
        <div className="text-center text-red-600 py-12">{error || 'Product not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/products" className="text-[#B8956B] font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Product Details</h1>
          <Link to="/cart" className="text-[#B8956B] relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#B8956B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Product Image */}
        <div className="aspect-square bg-stone-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Product Info */}
        <div className="px-4 py-5">
          {product.category && (
            <span className="inline-block px-3 py-1 bg-stone-100 text-[#8B7355] text-xs font-medium rounded-full mb-2 capitalize">
              {product.category}
            </span>
          )}

          <h1 className="text-2xl font-semibold text-[#5C4A3A] mb-2">
            {product.name}
          </h1>

          <p className="text-2xl font-bold text-[#B8956B] mb-4">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="text-[#8B7355] mb-4 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-[#8B7355] mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {product.stock > 0 ? (
              <span>{product.stock} in stock</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </div>

          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className={`w-full py-3 rounded-xl text-base font-medium transition-colors ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-[#B8956B] text-white hover:bg-[#A6845D]'
              }`}
            >
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 bg-stone-200 text-stone-500 rounded-xl text-base font-medium cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
