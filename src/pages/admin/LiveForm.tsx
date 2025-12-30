import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { Live, Product, LiveProduct, LiveStatus } from '../../types';

const CATEGORIES = ['rings', 'necklaces', 'earrings', 'bracelets'];

export default function LiveForm() {
  const { liveId } = useParams<{ liveId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const isEditing = liveId && liveId !== 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    scheduled_at: '',
    facebook_link: '',
    status: 'upcoming' as LiveStatus,
  });

  // Cover image
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previousCovers, setPreviousCovers] = useState<string[]>([]);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // New product inline form
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, [session?.access_token, liveId]);

  async function fetchData() {
    if (!session?.access_token) return;

    // Fetch all products
    const { data: products } = await db.query<Product[]>('products', {
      select: '*',
    }, session.access_token);
    setAllProducts(products || []);

    // Fetch previous covers for picker
    const { data: lives } = await db.query<Live[]>('lives', {
      select: 'cover_image',
    }, session.access_token);
    const covers = (lives || [])
      .map((l) => l.cover_image)
      .filter((c): c is string => !!c);
    setPreviousCovers([...new Set(covers)]);

    // If editing, fetch live data
    if (isEditing) {
      const { data: liveData } = await db.query<Live[]>('lives', {
        select: '*',
        eq: { id: liveId },
      }, session.access_token);

      if (liveData && liveData[0]) {
        const live = liveData[0];
        setFormData({
          title: live.title,
          scheduled_at: live.scheduled_at.slice(0, 16), // Format for datetime-local input
          facebook_link: live.facebook_link || '',
          status: live.status,
        });
        setCoverImage(live.cover_image || null);

        // Fetch live products
        const { data: liveProducts } = await db.query<LiveProduct[]>('live_products', {
          select: 'product_id',
          eq: { live_id: liveId },
        }, session.access_token);
        setSelectedProductIds((liveProducts || []).map((lp) => lp.product_id));
      }
    }

    setLoading(false);
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverImage(URL.createObjectURL(file));
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddNewProduct = async () => {
    if (!session?.access_token || !newProduct.name || !newProduct.price) return;

    const productData = {
      name: newProduct.name,
      description: newProduct.description || null,
      price: parseFloat(newProduct.price),
      category: newProduct.category || null,
      stock: 0,
      is_active: true,
    };

    const { data, error } = await db.insert<Product>('products', productData, session.access_token);
    if (error) {
      console.error('Failed to create product:', error);
      return;
    }

    if (data) {
      setAllProducts((prev) => [...prev, data]);
      setSelectedProductIds((prev) => [...prev, data.id]);
    }

    setNewProduct({ name: '', description: '', price: '', category: '' });
    setShowNewProductForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setSaving(true);

    let coverUrl = coverImage;

    // Upload cover image if new file selected
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `live-${Date.now()}.${fileExt}`;
      const { url, error } = await db.uploadFile('productImages', fileName, coverFile, session.access_token);
      if (error) {
        console.error('Failed to upload cover:', error);
        setSaving(false);
        return;
      }
      coverUrl = url;
    }

    const slug = generateSlug(formData.title);
    const liveData = {
      title: formData.title,
      slug,
      cover_image: coverUrl || null,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      facebook_link: formData.facebook_link || null,
      status: formData.status,
    };

    let savedLiveId = liveId;

    if (isEditing) {
      await db.update('lives', liveData, { id: liveId }, session.access_token);
    } else {
      const { data } = await db.insert<Live>('lives', liveData, session.access_token);
      if (data) {
        savedLiveId = data.id;
      }
    }

    // Update live products - delete existing and insert new
    if (savedLiveId && isEditing) {
      // For editing, we need to delete existing relationships first
      // Using raw fetch since our db wrapper doesn't have delete
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/live_products?live_id=eq.${savedLiveId}`, {
        method: 'DELETE',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    }

    // Insert new product relationships
    if (savedLiveId) {
      for (const productId of selectedProductIds) {
        await db.insert('live_products', {
          live_id: savedLiveId,
          product_id: productId,
        }, session.access_token);
      }
    }

    setSaving(false);
    navigate('/admin/lives');
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-[#8B7355]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin/lives" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">
            {isEditing ? 'Edit Live' : 'New Live'}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-semibold text-[#5C4A3A]">Basic Info</h2>

            <input
              type="text"
              placeholder="Live Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />

            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
              required
            />

            <div>
              <input
                type="url"
                placeholder={`Facebook Live Link ${formData.status === 'upcoming' ? '(optional)' : '*'}`}
                value={formData.facebook_link}
                onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                required={formData.status !== 'upcoming'}
              />
              {formData.status === 'upcoming' && (
                <p className="text-xs text-[#8B7355] mt-1">You can add the link later when going live</p>
              )}
            </div>

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LiveStatus })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-semibold text-[#5C4A3A]">Cover Image (Optional)</h2>

            {coverImage && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-stone-100">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="px-3 py-2 bg-[#B8956B] text-white rounded-lg text-sm font-medium text-center hover:bg-[#A6845D]">
                  Upload New
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
              {previousCovers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCoverPicker(!showCoverPicker)}
                  className="flex-1 px-3 py-2 bg-stone-100 text-[#5C4A3A] rounded-lg text-sm font-medium"
                >
                  Choose Previous
                </button>
              )}
            </div>

            {showCoverPicker && previousCovers.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previousCovers.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCoverImage(url);
                      setCoverFile(null);
                      setShowCoverPicker(false);
                    }}
                    className={`aspect-video rounded-lg overflow-hidden ${coverImage === url ? 'ring-2 ring-[#B8956B]' : ''}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#5C4A3A]">Products ({selectedProducts.length})</h2>
              <button
                type="button"
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="text-[#B8956B] text-sm font-medium"
              >
                {showProductPicker ? 'Done' : '+ Add Products'}
              </button>
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1"
                  >
                    <span className="text-sm text-[#5C4A3A]">{product.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className="text-[#8B7355] hover:text-red-500"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Product Picker */}
            {showProductPicker && (
              <div className="border border-stone-200 rounded-lg p-3 space-y-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                />

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                      />
                      <span className="text-sm text-[#5C4A3A]">{product.name}</span>
                      {product.category && (
                        <span className="text-xs text-[#8B7355] capitalize">({product.category})</span>
                      )}
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewProductForm(!showNewProductForm)}
                  className="w-full text-[#B8956B] text-sm font-medium py-2 border-t border-stone-100"
                >
                  + Create New Product
                </button>

                {/* New Product Inline Form */}
                {showNewProductForm && (
                  <div className="border-t border-stone-100 pt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Price *"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                      step="0.01"
                    />
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Description (optional)"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent resize-none"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewProduct}
                      disabled={!newProduct.name || !newProduct.price}
                      className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Product
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#B8956B] text-white py-3 rounded-xl font-medium hover:bg-[#A6845D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Live' : 'Create Live'}
          </button>
        </form>
      </main>
    </div>
  );
}
