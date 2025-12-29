import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden block hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg
              className="w-16 h-16"
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
      <div className="p-3">
        <h3 className="font-medium text-[#5C4A3A] text-sm truncate">
          {product.name}
        </h3>
        <p className="text-[#B8956B] font-bold mt-1">
          {formatPrice(product.price)}
        </p>
        {product.stock > 0 ? (
          <button
            onClick={handleAddToCart}
            className="w-full mt-2 bg-[#B8956B] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#A6845D] transition-colors"
          >
            Add to Cart
          </button>
        ) : (
          <button
            disabled
            className="w-full mt-2 bg-stone-200 text-stone-500 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>
    </Link>
  );
}
