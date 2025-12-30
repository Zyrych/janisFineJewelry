import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { Product } from '../../types';

const ALL_STATUSES = ['active', 'inactive'];
const CATEGORIES = ['rings', 'necklaces', 'earrings', 'bracelets'];

export default function AdminProducts() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUSES);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  useEffect(() => {
    fetchProducts();
  }, [session?.access_token]);

  async function fetchProducts() {
    if (!session?.access_token) return;

    const { data, error } = await db.query<Product[]>('products', {
      select: '*',
    }, session.access_token);

    if (error) {
      console.error('Failed to fetch products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Append new files to existing
      setImageFiles((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
      // Reset input to allow selecting same files again
      e.target.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setMainExistingImage = (index: number) => {
    setExistingImages((prev) => {
      const newArr = [...prev];
      const [selected] = newArr.splice(index, 1);
      return [selected, ...newArr];
    });
  };

  const setMainNewImage = (index: number) => {
    setImageFiles((prev) => {
      const newArr = [...prev];
      const [selected] = newArr.splice(index, 1);
      return [selected, ...newArr];
    });
    setImagePreviews((prev) => {
      const newArr = [...prev];
      const [selected] = newArr.splice(index, 1);
      return [selected, ...newArr];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setUploading(true);

    // Upload new images
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { url, error } = await db.uploadFile('productImages', fileName, file, session.access_token);

      if (error) {
        console.error('Failed to upload image:', error.message);
        setUploading(false);
        return;
      }
      if (url) uploadedUrls.push(url);
    }

    // Combine existing images with newly uploaded ones
    const allImages = [...existingImages, ...uploadedUrls];
    const mainImage = allImages[0] || null;

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      image_url: mainImage,
      images: allImages.length > 0 ? allImages : null,
      category: formData.category || null,
      stock: parseInt(formData.stock) || 0,
      is_active: true,
    };

    console.log('Saving product with data:', productData);

    if (editingProduct) {
      const result = await db.update('products', productData, { id: editingProduct.id }, session.access_token);
      console.log('Update result:', result);
    } else {
      const result = await db.insert('products', productData, session.access_token);
      console.log('Insert result:', result);
    }

    setFormData({ name: '', description: '', price: '', image_url: '', category: '', stock: '' });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setShowForm(false);
    setEditingProduct(null);
    setUploading(false);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category || '',
      stock: product.stock.toString(),
    });
    setImageFiles([]);
    setImagePreviews([]);
    // Load existing images
    const existing = product.images || (product.image_url ? [product.image_url] : []);
    setExistingImages(existing);
    setShowForm(true);
    // Scroll to form after it renders
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleActive = async (product: Product) => {
    if (!session?.access_token) return;
    await db.update('products', { is_active: !product.is_active }, { id: product.id }, session.access_token);
    fetchProducts();
  };

  const filteredProducts = products.filter((product) => {
    // Status filter
    const productStatus = product.is_active ? 'active' : 'inactive';
    const statusMatch = selectedStatuses.length === ALL_STATUSES.length || selectedStatuses.includes(productStatus);

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const searchMatch =
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query);

    return statusMatch && searchMatch;
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const selectAll = () => setSelectedStatuses(ALL_STATUSES);
  const clearAll = () => setSelectedStatuses([]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-stone-100 text-stone-500',
    };
    return colors[status] || 'bg-stone-100 text-stone-700';
  };

  const getFilterLabel = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) return 'All Products';
    if (selectedStatuses.length === 0) return 'None Selected';
    if (selectedStatuses.length === 1) return selectedStatuses[0].charAt(0).toUpperCase() + selectedStatuses[0].slice(1);
    return `${selectedStatuses.length} Selected`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">Products</h1>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', description: '', price: '', image_url: '', category: '', stock: '' });
              setImageFiles([]);
              setImagePreviews([]);
              setExistingImages([]);
              setShowForm(true);
            }}
            className="text-white/80 hover:text-white text-sm"
          >
            + Add
          </button>
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
              placeholder="Search by name, category, or description..."
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

        {/* Filter */}
        <div className="mb-4 relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-stone-200 text-[#5C4A3A] font-medium shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {getFilterLabel()}
            </span>
            <svg className={`w-5 h-5 text-[#8B7355] transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg z-20 p-3">
              <div className="flex justify-between mb-2 pb-2 border-b border-stone-100">
                <button onClick={selectAll} className="text-sm text-[#B8956B] font-medium hover:underline">
                  Select All
                </button>
                <button onClick={clearAll} className="text-sm text-[#8B7355] font-medium hover:underline">
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {ALL_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={() => setFilterOpen(false)} className="w-full mt-3 pt-2 border-t border-stone-100 text-sm text-[#5C4A3A] font-medium">
                Done
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-[#8B7355] text-sm mb-3">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}

        {showForm && (
          <div ref={formRef} className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-[#5C4A3A] mb-3">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5C4A3A] mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C4A3A] mb-1">Description</label>
                <textarea
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5C4A3A] mb-1">Price *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                    required
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5C4A3A] mb-1">Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C4A3A] mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm text-[#5C4A3A] font-medium">Product Images</label>
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100 group">
                        <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 ? (
                          <span className="absolute bottom-0 left-0 right-0 bg-[#B8956B] text-white text-[10px] text-center py-0.5">Main</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMainExistingImage(index)}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((url, index) => (
                      <div key={`new-${index}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100 ring-2 ring-green-400 group">
                        <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 && existingImages.length === 0 ? (
                          <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[10px] text-center py-0.5">Main (New)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMainNewImage(index)}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#B8956B] file:text-white hover:file:bg-[#A6845D]"
                />
                <p className="text-xs text-[#8B7355]">Hover and click "Set Main" to choose the main image</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-[#B8956B] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#A6845D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : editingProduct ? 'Update' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    setImageFiles([]);
                    setImagePreviews([]);
                    setExistingImages([]);
                  }}
                  className="flex-1 bg-stone-200 text-[#5C4A3A] py-2 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-[#8B7355] py-8">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-[#8B7355] py-8">No products found</div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl p-4 shadow-sm ${!product.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-stone-100 rounded-lg flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#5C4A3A] text-sm">{product.name}</h3>
                    <p className="text-[#B8956B] font-bold text-sm">{formatPrice(product.price)}</p>
                    <p className="text-[#8B7355] text-xs">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-stone-100 text-[#5C4A3A] py-2 rounded-xl text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(product)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                      product.is_active
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
