import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/db';
import { useCart } from '../contexts/CartContext';
import type { Live, LiveProduct, Product } from '../types';

export default function LiveDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [live, setLive] = useState<Live | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, totalItems } = useCart();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveAndProducts() {
      if (!slug) return;

      // Fetch live by slug
      const { data: liveData, error: liveError } = await db.query<Live[]>('lives', {
        select: '*',
        filters: { slug },
      });

      if (liveError || !liveData || liveData.length === 0) {
        console.error('Failed to fetch live:', liveError);
        setLoading(false);
        return;
      }

      const fetchedLive = liveData[0];
      setLive(fetchedLive);

      // Fetch live_products for this live
      const { data: liveProductsData, error: lpError } = await db.query<LiveProduct[]>('live_products', {
        select: '*',
        filters: { live_id: fetchedLive.id },
      });

      if (lpError) {
        console.error('Failed to fetch live products:', lpError);
        setLoading(false);
        return;
      }

      if (liveProductsData && liveProductsData.length > 0) {
        // Fetch actual products
        const productIds = liveProductsData.map((lp) => lp.product_id);
        const { data: productsData, error: pError } = await db.query<Product[]>('products', {
          select: '*',
        });

        if (!pError && productsData) {
          // Filter to only products in this live
          const liveProducts = productsData.filter((p) => productIds.includes(p.id));
          setProducts(liveProducts);
        }
      }

      setLoading(false);
    }

    fetchLiveAndProducts();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return (
        <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
          LIVE NOW
        </span>
      );
    }
    if (status === 'upcoming') {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-stone-100 text-stone-600 text-sm font-medium rounded-full">
        Ended
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-[#8B7355]">Loading...</p>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Link to="/lives" className="text-[#B8956B] font-medium">
              &larr; Back
            </Link>
            <h1 className="text-lg font-semibold text-[#5C4A3A]">Not Found</h1>
            <div className="w-10" />
          </div>
        </header>
        <main className="px-4 py-12 text-center">
          <p className="text-[#8B7355]">Live session not found.</p>
          <Link to="/lives" className="text-[#B8956B] underline mt-4 block">
            Browse all lives
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/lives" className="text-[#B8956B] font-medium">
            &larr; Lives
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A] truncate max-w-[150px]">
            {live.title}
          </h1>
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
        {/* Cover Image / Header */}
        <div className="relative h-48 bg-gradient-to-r from-[#5C4A3A] to-[#8B7355]">
          {live.cover_image ? (
            <img
              src={live.cover_image}
              alt={live.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(live.status)}
            </div>
            <h2 className="text-white text-xl font-semibold">{live.title}</h2>
          </div>
        </div>

        {/* Live Info */}
        <div className="px-4 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2 text-[#8B7355] mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{formatDate(live.scheduled_at)}</span>
          </div>

          {live.facebook_link ? (
            <a
              href={live.facebook_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#1877F2] text-white py-3 rounded-xl font-medium hover:bg-[#166FE5] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {live.status === 'live' ? 'Watch on Facebook' : 'View on Facebook'}
            </a>
          ) : (
            <div className="text-center text-[#8B7355] py-2">
              <p className="text-sm">Facebook link will be available when we go live</p>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4">
            Products in this Live ({products.length})
          </h3>

          {products.length === 0 ? (
            <p className="text-[#8B7355] text-center py-8">
              No products added to this live yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square bg-stone-100">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link to={`/products/${product.id}`}>
                      <h4 className="font-medium text-[#5C4A3A] text-sm truncate hover:text-[#B8956B]">
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-[#B8956B] font-semibold text-sm mt-1">
                      {formatPrice(product.price)}
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addedProductId === product.id}
                      className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        addedProductId === product.id
                          ? 'bg-green-500 text-white'
                          : 'bg-[#B8956B] text-white hover:bg-[#A6845D]'
                      }`}
                    >
                      {addedProductId === product.id ? 'Added!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
