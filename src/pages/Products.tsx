import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types';

const CATEGORIES = ['all', 'rings', 'necklaces', 'earrings', 'bracelets'];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await db.query<Product[]>('products', {
        select: '*',
        eq: { is_active: 'true' },
      });

      if (error) {
        setError('Failed to load products');
        console.error(error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    // Category filter
    const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categoryMatch;

    const searchMatch =
      p.name?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/" className="text-[#B8956B] font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Collection</h1>
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

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
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

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#B8956B] text-white'
                  : 'bg-white text-[#5C4A3A] border border-stone-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-[#8B7355] py-12">
            Loading products...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-[#8B7355] py-12">
            <p>No products found.</p>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-[#B8956B] text-sm mt-2 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
