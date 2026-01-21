'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Save, X, LogOut, Package, ShoppingBag, Users, BarChart3, Ticket, Power, PowerOff, Store, Star } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  sizes?: string[]
  colors?: string[]
  inStock: boolean
  featured?: boolean
  quantity?: number
  brand?: string
  material?: string
  weight?: number
  measurements?: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'analytics' | 'discounts' | 'customers' | 'inventory' | 'users' | 'reviews'>('products')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchProducts()
    }
  }, [status, router])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
      setFilteredProducts(data)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load products')
      setLoading(false)
    }
  }

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products

    // Apply search filter
    if (productSearchTerm) {
      const searchLower = productSearchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (productCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === productCategoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, productSearchTerm, productCategoryFilter])

  const handleDelete = async (id: string) => {
    // Check if this is a placeholder product
    if (/^\d+$/.test(id)) {
      toast.error('Cannot delete placeholder products. Add real products to the database first.', {
        duration: 5000,
      })
      return
    }

    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Product deleted')
        fetchProducts()
      } else {
        let errorData
        try {
          const text = await res.text()
          errorData = text ? JSON.parse(text) : { error: 'Unknown error' }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: `Server error (${res.status}): ${res.statusText}` }
        }
        console.error('Delete error:', errorData)
        toast.error(errorData.error || 'Failed to delete product', {
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product. Please check your connection.', {
        duration: 5000,
      })
    }
  }

  const handleSave = async (product: Product) => {
    try {
      // Ensure we have a valid ID when editing
      if (editingProduct && !editingProduct.id) {
        console.error('[AdminDashboard] Editing product but no ID found:', editingProduct)
        toast.error('Cannot update product: Product ID is missing')
        return
      }

      // Determine if we're editing or creating
      const isEditing = editingProduct && editingProduct.id
      const url = isEditing 
        ? `/api/products/${editingProduct.id}`.replace(/\/+$/, '') // Remove trailing slashes
        : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      
      console.log('[AdminDashboard] Saving product:', {
        isEditing,
        editingProduct: editingProduct ? { id: editingProduct.id, name: editingProduct.name } : null,
        url,
        method,
      })
      
      // Clean up the product data - convert empty strings to null/undefined for optional fields
      const cleanedProduct = {
        ...product,
        name: product.name?.trim() || '',
        description: product.description?.trim() || '',
        category: product.category?.trim() || '',
        price: Number(product.price) || 0,
        brand: product.brand?.trim() || undefined,
        material: product.material?.trim() || undefined,
        measurements: product.measurements?.trim() || undefined,
        weight: product.weight ? Number(product.weight) : undefined,
        sizes: product.sizes?.filter(s => s && s.trim()) || [],
        colors: product.colors?.filter(c => c && c.trim()) || [],
        images: product.images?.filter(img => img && img.trim()) || [],
        quantity: product.quantity || 0,
        inStock: product.inStock !== false,
        featured: product.featured || false,
      }

      console.log('[AdminDashboard] Cleaned product data:', {
        url,
        method,
        cleanedProduct: {
          ...cleanedProduct,
          images: cleanedProduct.images?.length || 0,
        },
      })
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProduct),
      })

      console.log('[AdminDashboard] Save response status:', res.status, res.statusText)

      if (res.ok) {
        toast.success(editingProduct ? 'Product updated' : 'Product created')
        setEditingProduct(null)
        setIsAdding(false)
        fetchProducts()
      } else {
        let errorData
        let errorText = ''
        try {
          errorText = await res.text()
          console.log('[AdminDashboard] Error response text:', errorText)
          errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' }
        } catch (parseError) {
          console.error('[AdminDashboard] Failed to parse error response:', parseError)
          console.error('[AdminDashboard] Raw error text:', errorText)
          errorData = { 
            error: `Server error (${res.status}): ${res.statusText}`,
            details: errorText || 'No error details available'
          }
        }
        console.error('[AdminDashboard] Product save error:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          rawText: errorText,
        })
        
        // If error is about featured limit, show modal instead of toast
        if (errorData.error && errorData.error.includes('Maximum 4 featured products')) {
          // This is handled by the ProductForm component, but if we get here,
          // it means the frontend check was bypassed - trigger modal in form
          toast.error('Please use the modal to select which featured product to remove', {
            duration: 5000,
          })
        } else {
          // Show detailed error message
          const errorMessage = errorData.details 
            ? `${errorData.error || 'Failed to save product'}: ${errorData.details}`
            : errorData.error || errorData.message || `Failed to save product (${res.status})`
          
          toast.error(errorMessage, {
            duration: 8000,
          })
        }
      }
    } catch (error: any) {
      console.error('[AdminDashboard] Product save exception:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error,
      })
      toast.error(
        error.message || 'Failed to save product. Please check your connection and console for details.', 
        {
          duration: 8000,
        }
      )
    }
  }

  const handleLogout = async () => {
    // Sign out and clear all session data
    await signOut({ 
      redirect: false,
      callbackUrl: '/'
    })
    
    // Clear any cached session data
    if (typeof window !== 'undefined') {
      // Clear NextAuth session cookie explicitly
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
        if (name.startsWith('next-auth') || name.startsWith('__Secure-next-auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
    }
    
    router.push('/?showStart=true')
    router.refresh()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  const newProduct: Product = {
    id: '',
    name: '',
    description: '',
    price: 0,
    images: [''],
    category: 'tops',
    sizes: [],
    colors: [],
    inStock: true,
    featured: false,
    quantity: 0,
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-thin text-white tracking-wider">ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Store size={16} />
                Go to Shop
              </Link>
              <span className="text-gray-400 text-sm">{session?.user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'products'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Package size={18} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <ShoppingBag size={18} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'discounts'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Ticket size={18} />
              Discount Codes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Users size={18} />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Star size={18} />
              Reviews
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-thin text-white tracking-wider">Products</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Featured: {products.filter((p) => p.featured).length}/3 | Total: {products.length}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500 text-sm"
                />
                {/* Category Filter */}
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="footwear">Footwear</option>
                  <option value="accessories">Accessories</option>
                </select>
                <button
                  onClick={() => {
                    setIsAdding(true)
                    setEditingProduct(null) // Clear editing product when adding new
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Product
                </button>
              </div>
            </div>

            {(isAdding || editingProduct) && (
              <ProductForm
                product={editingProduct || newProduct}
                onSave={handleSave}
                onCancel={() => {
                  setIsAdding(false)
                  setEditingProduct(null)
                }}
                allProducts={products}
              />
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <p className="text-gray-400 mb-4">No products yet. Add your first product!</p>
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 && products.length > 0 && (
                  <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800 mb-6">
                    <p className="text-gray-400">No products match your search criteria</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                      {product.featured && (
                        <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">
                          Featured
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 text-white">{product.name}</h3>
                      <p className="text-white font-semibold mb-2">€{product.price.toFixed(2)}</p>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setIsAdding(false)
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'orders' && <OrdersTab />}

        {activeTab === 'analytics' && <AnalyticsTab />}

        {activeTab === 'discounts' && (
          <DiscountCodesTab />
        )}

        {activeTab === 'customers' && <CustomersTab />}

        {activeTab === 'users' && <UserManagementTab />}

        {activeTab === 'inventory' && <InventoryTab products={products} onUpdate={fetchProducts} />}

        {activeTab === 'reviews' && <ReviewsTab />}
      </div>
    </div>
  )
}

// Discount Codes Management Component
function DiscountCodesTab() {
  const [discountCodes, setDiscountCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCode, setEditingCode] = useState<any | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      const res = await fetch('/api/discounts')
      if (res.ok) {
        const data = await res.json()
        setDiscountCodes(data)
      } else {
        toast.error('Failed to load discount codes')
      }
    } catch (error) {
      toast.error('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        toast.success(`Discount code ${!currentStatus ? 'enabled' : 'disabled'}`)
        fetchDiscountCodes()
      } else {
        toast.error('Failed to update discount code')
      }
    } catch (error) {
      toast.error('Failed to update discount code')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return

    try {
      const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Discount code deleted')
        fetchDiscountCodes()
      } else {
        toast.error('Failed to delete discount code')
      }
    } catch (error) {
      toast.error('Failed to delete discount code')
    }
  }

  const handleSave = async (codeData: any) => {
    try {
      const url = editingCode?.id ? `/api/discounts/${editingCode.id}` : '/api/discounts'
      const method = editingCode?.id ? 'PATCH' : 'POST'
      
      // Clean up the data - remove null/empty values for optional fields
      const cleanData: any = {
        code: codeData.code?.trim().toUpperCase(),
        type: codeData.type,
        value: Number(codeData.value),
        isActive: codeData.isActive ?? true
      }
      
      // Validate required fields
      if (!cleanData.code || !cleanData.type || cleanData.value === undefined || isNaN(cleanData.value)) {
        toast.error('Please fill in all required fields')
        throw new Error('Validation failed')
      }
      
      if (codeData.minPurchase) cleanData.minPurchase = codeData.minPurchase
      if (codeData.maxDiscount) cleanData.maxDiscount = codeData.maxDiscount
      if (codeData.usageLimit) cleanData.usageLimit = codeData.usageLimit
      // Only include dates if they're actually set (not null, not empty string)
      cleanData.validFrom = codeData.validFrom && codeData.validFrom !== '' ? codeData.validFrom : null
      cleanData.validUntil = codeData.validUntil && codeData.validUntil !== '' ? codeData.validUntil : null
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      })

      const responseData = await res.json()

      if (res.ok) {
        toast.success(editingCode?.id ? 'Discount code updated' : 'Discount code created')
        setEditingCode(null)
        setIsAdding(false)
        fetchDiscountCodes()
      } else {
        toast.error(responseData.error || 'Failed to save discount code')
        console.error('API Error:', responseData)
      }
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save discount code')
      throw error // Re-throw so form can handle loading state
    }
  }

  const newCode = {
    code: '',
    type: 'percentage',
    value: 10,
    minPurchase: null,
    maxDiscount: null,
    usageLimit: null,
    validFrom: null,
    validUntil: null,
    isActive: true
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">Discount Codes</h2>
          <p className="text-gray-400 text-sm mt-1">
            Active: {discountCodes.filter(c => c.isActive).length} / Total: {discountCodes.length}
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingCode(newCode)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Discount Code
        </button>
      </div>

      {(isAdding || editingCode) && (
        <DiscountCodeForm
          code={editingCode || newCode}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false)
            setEditingCode(null)
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        </div>
      ) : discountCodes.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-gray-400 mb-4">No discount codes yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Code</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Value</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Usage</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Expires</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {discountCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-white font-semibold">{code.code}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 capitalize">{code.type}</td>
                  <td className="px-6 py-4 text-white">
                    {code.type === 'percentage' ? `${code.value}%` : `€${Number(code.value).toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {code.usageLimit 
                      ? `${code.usedCount} / ${code.usageLimit}`
                      : `${code.usedCount} uses`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      code.isActive 
                        ? 'bg-green-900/30 text-green-400 border border-green-800'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {code.validUntil 
                      ? new Date(code.validUntil).toLocaleDateString()
                      : 'No expiry'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(code.id, code.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          code.isActive
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                        }`}
                        title={code.isActive ? 'Disable' : 'Enable'}
                      >
                        {code.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCode(code)
                          setIsAdding(false)
                        }}
                        className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// Discount Code Form Component
function DiscountCodeForm({
  code,
  onSave,
  onCancel,
}: {
  code: any
  onSave: (code: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(code)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormData(code)
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-mono"
              required
              disabled={!!code?.id}
            />
            {code?.id && <p className="text-xs text-gray-400 mt-1">Code cannot be changed after creation</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              required
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Value {formData.type === 'percentage' ? '(%)' : '(EUR)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.value || ''}
              onChange={(e) => {
                const val = e.target.value
                updateField('value', val === '' ? 0 : parseFloat(val))
              }}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Purchase (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.minPurchase || ''}
              onChange={(e) => updateField('minPurchase', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              min="0"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Discount (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.maxDiscount || ''}
              onChange={(e) => updateField('maxDiscount', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              min="0"
              placeholder="Optional (for percentage)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit</label>
            <input
              type="number"
              value={formData.usageLimit || ''}
              onChange={(e) => updateField('usageLimit', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              min="1"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valid From
              <span className="text-xs text-gray-500 ml-2">(Leave empty to start immediately)</span>
            </label>
            <input
              type="datetime-local"
              value={formData.validFrom ? new Date(formData.validFrom).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  // Convert local datetime to ISO string
                  const localDate = new Date(e.target.value)
                  updateField('validFrom', localDate.toISOString())
                } else {
                  updateField('validFrom', null)
                }
              }}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valid Until
              <span className="text-xs text-gray-500 ml-2">(Leave empty for no expiry)</span>
            </label>
            <input
              type="datetime-local"
              value={formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  // Convert local datetime to ISO string
                  const localDate = new Date(e.target.value)
                  updateField('validUntil', localDate.toISOString())
                } else {
                  updateField('validUntil', null)
                }
              }}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="w-4 h-4"
            />
            <span>Active (enabled)</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSubmitting ? 'Saving...' : 'Save Discount Code'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// Orders Management Component
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStatus, setEditingStatus] = useState<string>('')
  const [trackingNumber, setTrackingNumber] = useState<string>('')
  const [shippingMethod, setShippingMethod] = useState<string>('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  useEffect(() => {
    let filtered = orders
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower)
      )
    }
    setFilteredOrders(filtered)
  }, [orders, searchTerm])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all' ? '/api/orders' : `/api/orders?status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const orderData = await res.json()
        console.log('[AdminDashboard] Fetched order details:', orderData)
        console.log('[AdminDashboard] Shipping address:', orderData.shippingAddress)
        return orderData
      }
      return null
    } catch (error) {
      console.error('Failed to fetch order details:', error)
      return null
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          shippingMethod: shippingMethod || undefined,
        })
      })

      if (res.ok) {
        toast.success('Order status updated')
        fetchOrders()
        setSelectedOrder(null)
        setEditingStatus('')
        setTrackingNumber('')
        setShippingMethod('')
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to update order')
      }
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportOrdersToCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Status', 'Items', 'Subtotal', 'Shipping', 'Tax', 'Total', 'Payment Method']
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      formatDate(order.createdAt),
      order.customerName || order.user?.name || 'Guest',
      order.customerEmail || order.user?.email || '',
      order.status,
      order.items.length,
      `€${Number(order.subtotal).toFixed(2)}`,
      `€${Number(order.shipping).toFixed(2)}`,
      `€${Number(order.tax).toFixed(2)}`,
      `€${Number(order.total).toFixed(2)}`,
      order.paymentMethod || 'N/A'
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Orders exported to CSV')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading orders...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">Orders</h2>
          <p className="text-gray-400 text-sm mt-1">
            Total: {orders.length} orders {searchTerm && `(${filteredOrders.length} filtered)`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={exportOrdersToCSV}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 && orders.length > 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">No orders match your search</h3>
          <p className="text-gray-400">Try adjusting your search or filter.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">No orders found</h3>
          <p className="text-gray-400">Try adjusting your filter or wait for new orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-light text-white">
                      Order #{order.orderNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <div>
                      <span className="text-gray-500">Customer:</span>{' '}
                      <span className="text-white">{order.customerName || order.user?.name || 'Guest'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{' '}
                      <span className="text-white">{order.customerEmail || order.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>{' '}
                      <span className="text-white">{formatDate(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>{' '}
                      <span className="text-white capitalize">{order.paymentMethod || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Items:</span>{' '}
                      <span className="text-white">{order.items.length} item(s)</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>{' '}
                      <span className="text-white font-medium">€{Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Tracking:</span>{' '}
                      <span className="text-white">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      // Fetch full order details including shipping address
                      const fullOrder = await fetchOrderDetails(order.id)
                      if (fullOrder) {
                        setSelectedOrder(fullOrder)
                        setEditingStatus(fullOrder.status)
                        setTrackingNumber(fullOrder.trackingNumber || '')
                        setShippingMethod(fullOrder.shippingMethod || '')
                      } else {
                        // Fallback to order from list if fetch fails
                        setSelectedOrder(order)
                        setEditingStatus(order.status)
                        setTrackingNumber(order.trackingNumber || '')
                        setShippingMethod(order.shippingMethod || '')
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-white">
                Order #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setEditingStatus('')
                  setTrackingNumber('')
                  setShippingMethod('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h4 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Customer Information</h4>
              <div className="bg-black border border-gray-800 p-4 text-sm space-y-1">
                <p className="text-white font-medium">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest'}</p>
                <p className="text-gray-400">{selectedOrder.customerEmail || selectedOrder.user?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Shipping Address</h4>
              {selectedOrder.shippingAddress ? (
                <div className="bg-black border border-gray-800 p-4 text-sm space-y-1">
                  <p className="text-white font-medium">{selectedOrder.shippingAddress.fullName || selectedOrder.customerName || 'N/A'}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-gray-400">{selectedOrder.customerEmail}</p>
                  )}
                  {selectedOrder.shippingAddress.phone && (
                    <p className="text-gray-400">Phone: {selectedOrder.shippingAddress.phone}</p>
                  )}
                  <p className="text-gray-300 mt-2">{selectedOrder.shippingAddress.street || 'N/A'}</p>
                  <p className="text-gray-300">
                    {selectedOrder.shippingAddress.city || 'N/A'}, {selectedOrder.shippingAddress.postalCode || 'N/A'}
                  </p>
                  <p className="text-gray-300">{selectedOrder.shippingAddress.country || 'N/A'}</p>
                </div>
              ) : (
                <div className="bg-black border border-gray-800 p-4 text-sm">
                  <p className="text-yellow-400 text-xs">⚠️ Shipping address not available for this order</p>
                  <p className="text-gray-400 text-xs mt-2">This order may have been created before address storage was implemented.</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-black border border-gray-800">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.productName}
                        className="w-16 h-16 object-contain border border-gray-800"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-light">{item.productName}</p>
                      {item.size && <p className="text-gray-400 text-sm">Size: {item.size}</p>}
                      {item.color && <p className="text-gray-400 text-sm">Color: {item.color}</p>}
                      <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Shipping Address</h4>
              {selectedOrder.shippingAddress ? (
                <div className="bg-black border border-gray-800 p-4 text-sm space-y-1">
                  <p className="text-white font-medium">{selectedOrder.shippingAddress.fullName || selectedOrder.customerName || 'N/A'}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-gray-400">{selectedOrder.customerEmail}</p>
                  )}
                  {selectedOrder.shippingAddress.phone && (
                    <p className="text-gray-400">Phone: {selectedOrder.shippingAddress.phone}</p>
                  )}
                  <p className="text-gray-300 mt-2">
                    {selectedOrder.shippingAddress.street || 'N/A'}
                    {selectedOrder.shippingAddress.apartment && `, ${selectedOrder.shippingAddress.apartment}`}
                  </p>
                  <p className="text-gray-300">
                    {selectedOrder.shippingAddress.city || 'N/A'}
                    {selectedOrder.shippingAddress.province && `, ${selectedOrder.shippingAddress.province}`}
                    {selectedOrder.shippingAddress.postalCode && ` ${selectedOrder.shippingAddress.postalCode}`}
                  </p>
                  <p className="text-gray-300">{selectedOrder.shippingAddress.country || 'N/A'}</p>
                </div>
              ) : (
                <div className="bg-black border border-gray-800 p-4 text-sm space-y-1">
                  <p className="text-yellow-400 text-xs">Shipping address not available for this order</p>
                  {selectedOrder.customerName && (
                    <p className="text-white font-medium mt-2">{selectedOrder.customerName}</p>
                  )}
                  {selectedOrder.customerEmail && (
                    <p className="text-gray-400">{selectedOrder.customerEmail}</p>
                  )}
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Subtotal:</span>{' '}
                <span className="text-white">€{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Shipping:</span>{' '}
                <span className="text-white">€{Number(selectedOrder.shipping).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Tax:</span>{' '}
                <span className="text-white">€{Number(selectedOrder.tax).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>{' '}
                <span className="text-white font-medium">€{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Status Update */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order Status</label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Shipping Method</label>
                <input
                  type="text"
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  placeholder="e.g., DHL Express, Standard Shipping"
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, editingStatus)}
                className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Update Order
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setEditingStatus('')
                  setTrackingNumber('')
                  setShippingMethod('')
                }}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

function ProductForm({
  product,
  onSave,
  onCancel,
  allProducts,
}: {
  product: Product
  onSave: (product: Product) => void
  onCancel: () => void
  allProducts: Product[]
}) {
  const [formData, setFormData] = useState<Product>({
    ...product,
    images: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images : [''],
    sizes: product.sizes || [],
    colors: product.colors || [],
  })
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({})
  const [dragActive, setDragActive] = useState(false)
  const [showFeaturedModal, setShowFeaturedModal] = useState(false)
  const [selectedProductToRemove, setSelectedProductToRemove] = useState<string | null>(null)
  const [allFeaturedProducts, setAllFeaturedProducts] = useState<Product[]>([])

  // Sync formData when product prop changes
  useEffect(() => {
    setFormData({
      ...product,
      images: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images : [''],
      sizes: product.sizes || [],
      colors: product.colors || [],
    })
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if trying to set featured to true
    if (formData.featured && !product.featured) {
      try {
        // Query backend for actual featured count (includes out-of-stock products)
        // This ensures we get the real count, not filtered by frontend
        const featuredRes = await fetch('/api/products?featuredCount=true')
        const featuredData = await featuredRes.json()
        const actualFeaturedCount = featuredData.count || 0
        
        console.log('[ProductForm] Featured check:', {
          actualFeaturedCount,
          frontendCount: allProducts.filter(p => p.featured).length,
          productId: product.id,
          featuredProducts: allProducts.filter(p => p.featured).map(p => ({ id: p.id, name: p.name }))
        })
        
        // Allow up to 4 featured products total (if count is 4 or more, we're trying to add a 5th)
        if (actualFeaturedCount >= 4) {
          // Fetch all featured products from backend (including out-of-stock) for the modal
          try {
            const allFeaturedRes = await fetch('/api/products?allFeatured=true')
            if (!allFeaturedRes.ok) {
              throw new Error(`Failed to fetch: ${allFeaturedRes.status}`)
            }
            const allFeaturedData = await allFeaturedRes.json()
            const fetchedProducts = Array.isArray(allFeaturedData) ? allFeaturedData : []
            console.log('[ProductForm] Fetched all featured products:', fetchedProducts.length, fetchedProducts.map(p => ({ id: p.id, name: p.name, inStock: p.inStock })))
            setAllFeaturedProducts(fetchedProducts)
            // Show modal AFTER fetching products
            setShowFeaturedModal(true)
          } catch (fetchError) {
            console.error('[ProductForm] Error fetching all featured products:', fetchError)
            // Fallback to frontend products but still show modal
            setAllFeaturedProducts(allProducts.filter(p => p.featured))
            setShowFeaturedModal(true)
            toast.error('Could not load all featured products. Some out-of-stock items may be missing.', { duration: 5000 })
          }
          return
        }
      } catch (error) {
        console.error('[ProductForm] Error checking featured count:', error)
        // Fallback to frontend count if API fails
        const currentFeaturedCount = allProducts.filter(
          (p) => p.featured && p.id !== product.id
        ).length
        if (currentFeaturedCount >= 4) {
          // Try to fetch all featured products even if count check failed
          try {
            const allFeaturedRes = await fetch('/api/products?allFeatured=true')
            if (allFeaturedRes.ok) {
              const allFeaturedData = await allFeaturedRes.json()
              setAllFeaturedProducts(Array.isArray(allFeaturedData) ? allFeaturedData : [])
            }
          } catch (e) {
            // Ignore errors in fallback
          }
          setShowFeaturedModal(true)
          return
        }
      }
    }
    
    onSave(formData)
  }

  const handleFeaturedConfirm = async () => {
    if (!selectedProductToRemove) {
      toast.error('Please select a product to remove from featured')
      return
    }

    // Remove featured from selected product - check both allProducts and allFeaturedProducts
    const productToUpdate = allProducts.find((p) => p.id === selectedProductToRemove) 
      || allFeaturedProducts.find((p) => p.id === selectedProductToRemove)
    if (!productToUpdate) {
      toast.error('Product not found')
      return
    }

    try {
      // Clean up the product data before sending
      const cleanedProductToUpdate = {
        ...productToUpdate,
        featured: false,
        brand: productToUpdate.brand?.trim() || undefined,
        material: productToUpdate.material?.trim() || undefined,
        measurements: productToUpdate.measurements?.trim() || undefined,
        weight: productToUpdate.weight || undefined,
        sizes: productToUpdate.sizes?.filter(s => s.trim()) || [],
        colors: productToUpdate.colors?.filter(c => c.trim()) || [],
        images: productToUpdate.images?.filter(img => img.trim()) || [],
      }

      // First, remove featured from the selected product
      const removeRes = await fetch(`/api/products/${selectedProductToRemove}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProductToUpdate),
      })

      if (!removeRes.ok) {
        let errorData
        try {
          const text = await removeRes.text()
          errorData = text ? JSON.parse(text) : { error: 'Unknown error' }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: `Server error (${removeRes.status}): ${removeRes.statusText}` }
        }
        console.error('Remove featured error:', errorData)
        throw new Error(errorData.error || errorData.message || 'Failed to remove featured status')
      }

      // Now save the current product as featured
      onSave(formData)
      setShowFeaturedModal(false)
      setSelectedProductToRemove(null)
      toast.success('Featured products updated')
    } catch (error: any) {
      console.error('Featured update error:', error)
      toast.error(error.message || 'Failed to update featured products', {
        duration: 5000,
      })
    }
  }

  const updateField = (field: keyof Product, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const addImage = () => {
    const currentImages = Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : ['']
    setFormData({ ...formData, images: [...currentImages, ''] })
  }

  const updateImage = (index: number, value: string) => {
    console.log('[AdminDashboard] updateImage called:', { index, value })
    const currentImages = Array.isArray(formData.images) ? formData.images : ['']
    const newImages = [...currentImages]
    if (index >= newImages.length) {
      // Extend array if index is out of bounds
      newImages.length = index + 1
    }
    newImages[index] = value
    console.log('[AdminDashboard] Updating formData.images:', {
      old: currentImages,
      new: newImages,
    })
    setFormData({ ...formData, images: newImages })
  }

  const removeImage = (index: number) => {
    const currentImages = Array.isArray(formData.images) ? formData.images : ['']
    const filtered = currentImages.filter((_, i) => i !== index)
    // Ensure at least one empty image slot remains
    setFormData({ ...formData, images: filtered.length > 0 ? filtered : [''] })
  }

  const addSize = () => {
    setFormData({ ...formData, sizes: [...(formData.sizes || []), ''] })
  }

  const updateSize = (index: number, value: string) => {
    const newSizes = [...(formData.sizes || [])]
    newSizes[index] = value
    setFormData({ ...formData, sizes: newSizes })
  }

  const removeSize = (index: number) => {
    setFormData({ ...formData, sizes: formData.sizes?.filter((_, i) => i !== index) })
  }

  const addColor = () => {
    setFormData({ ...formData, colors: [...(formData.colors || []), ''] })
  }

  const updateColor = (index: number, value: string) => {
    const newColors = [...(formData.colors || [])]
    newColors[index] = value
    setFormData({ ...formData, colors: newColors })
  }

  const removeColor = (index: number) => {
    setFormData({ ...formData, colors: formData.colors?.filter((_, i) => i !== index) })
  }

  const handleFileUpload = async (file: File, imageIndex: number) => {
    console.log('[AdminDashboard] Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      imageIndex,
    })

    setUploading((prev) => ({ ...prev, [imageIndex]: true }))

    try {
      // Compress image before upload if it's larger than 2MB
      let fileToUpload = file
      const maxSizeMB = 2 // Target size after compression
      const originalSizeMB = file.size / (1024 * 1024)
      
      if (originalSizeMB > maxSizeMB) {
        toast.loading(`Compressing image (${originalSizeMB.toFixed(1)}MB)...`, { id: 'compressing' })
        
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 1920, // Max dimension (maintains aspect ratio)
          useWebWorker: true,
          fileType: file.type,
        }
        
        try {
          const compressedFile = await imageCompression(file, options)
          const compressedSizeMB = compressedFile.size / (1024 * 1024)
          console.log('[AdminDashboard] Image compressed:', {
            original: `${originalSizeMB.toFixed(2)}MB`,
            compressed: `${compressedSizeMB.toFixed(2)}MB`,
            reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
          })
          fileToUpload = compressedFile
          toast.success(`Compressed to ${compressedSizeMB.toFixed(1)}MB`, { id: 'compressing' })
        } catch (compressionError) {
          console.warn('[AdminDashboard] Compression failed, using original file:', compressionError)
          toast.dismiss('compressing')
          // Continue with original file if compression fails
        }
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', fileToUpload)

      console.log('[AdminDashboard] Sending upload request...')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      console.log('[AdminDashboard] Upload response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      })

      if (!res.ok) {
        let errorData
        try {
          const text = await res.text()
          console.log('[AdminDashboard] Error response text:', text)
          errorData = text ? JSON.parse(text) : { error: 'Upload failed' }
        } catch (parseError) {
          console.error('[AdminDashboard] Failed to parse upload error:', parseError)
          errorData = { error: `Server error (${res.status}): ${res.statusText}` }
        }
        console.error('[AdminDashboard] Upload error:', errorData)
        
        // Show more detailed error message
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Upload failed'
        
        throw new Error(errorMessage)
      }

      const data = await res.json()
      console.log('[AdminDashboard] Upload success data:', data)

      if (!data.url) {
        console.error('[AdminDashboard] No URL in response:', data)
        throw new Error('No URL returned from upload')
      }

      console.log('[AdminDashboard] Updating image at index', imageIndex, 'with URL:', data.url)
      updateImage(imageIndex, data.url)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('[AdminDashboard] File upload error:', error)
      toast.error(error.message || 'Failed to upload image', {
        duration: 5000,
      })
    } finally {
      setUploading((prev) => ({ ...prev, [imageIndex]: false }))
      console.log('[AdminDashboard] Upload finished, resetting loading state')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    console.log('[AdminDashboard] File selected:', {
      files: e.target.files,
      imageIndex,
    })
    const file = e.target.files?.[0]
    if (file) {
      console.log('[AdminDashboard] Calling handleFileUpload with file:', file.name)
      handleFileUpload(file, imageIndex)
    } else {
      console.warn('[AdminDashboard] No file selected')
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent, imageIndex: number) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, imageIndex)
    } else {
      toast.error('Please drop an image file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Price (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => updateField('price', parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              required
            >
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="footwear">Footwear</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity || 0}
              onChange={(e) => updateField('quantity', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
            <input
              type="text"
              value={formData.brand || ''}
              onChange={(e) => updateField('brand', e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Material</label>
            <input
              type="text"
              value={formData.material || ''}
              onChange={(e) => updateField('material', e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Measurements (visible when clicked)</label>
          <textarea
            value={formData.measurements || ''}
            onChange={(e) => updateField('measurements', e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
            rows={3}
            placeholder="e.g., Chest: 40cm, Length: 65cm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Product Images
          </label>
          <p className="text-xs text-gray-400 mb-4">
            Upload images directly or paste image URLs
          </p>
          
          <div className="space-y-4">
            {(Array.isArray(formData.images) ? formData.images : ['']).map((image, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  {/* File Upload Area */}
                  <div
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      dragActive
                        ? 'border-white bg-gray-800'
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-2">
                          Upload Image
                        </label>
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(e, index)}
                              className="hidden"
                              disabled={uploading[index]}
                            />
                            <div className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-center font-medium cursor-pointer disabled:opacity-50">
                              {uploading[index] ? 'Uploading...' : 'Choose File'}
                            </div>
                          </label>
                          <span className="text-xs text-gray-400 self-center">or drag & drop</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Or paste image URL
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => updateImage(index, e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                      disabled={uploading[index]}
                    />
                  </div>

                  {/* Image Preview */}
                  {image && !uploading[index] && (
                    <div className="mt-2 w-full h-32 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500 text-sm">Invalid image URL</div>'
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploading[index] && (
                    <div className="mt-2 w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-white h-full animate-pulse" style={{ width: '50%' }}></div>
                    </div>
                  )}
                </div>
                {(Array.isArray(formData.images) ? formData.images : ['']).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors mt-0"
                    disabled={uploading[index]}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addImage}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Another Image
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sizes (US)</label>
            {formData.sizes?.map((size, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={size}
                  onChange={(e) => updateSize(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="e.g., S, M, L"
                />
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSize}
              className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Add Size
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Colors</label>
            {formData.colors?.map((color, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="e.g., Black, White"
                />
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addColor}
              className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Add Color
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => updateField('inStock', e.target.checked)}
              className="w-4 h-4"
            />
            <span>In Stock</span>
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span>
              Featured 
              {allProducts.filter((p) => p.featured && p.id !== product.id).length >= 4 && !formData.featured && (
                <span className="text-yellow-400 text-xs ml-2">(Max 4 - {allProducts.filter((p) => p.featured && p.id !== product.id).length} already featured)</span>
              )}
            </span>
          </label>
        </div>

        {/* Featured Product Selection Modal */}
        {showFeaturedModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Maximum 4 Featured Products
              </h3>
              <p className="text-gray-300 mb-4">
                You already have 4 featured products. Please select one to remove from featured:
              </p>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {(() => {
                  // Use allFeaturedProducts if available, otherwise fallback to allProducts
                  const productsToShow = allFeaturedProducts.length > 0 
                    ? allFeaturedProducts 
                    : allProducts.filter(p => p.featured)
                  const filtered = productsToShow.filter((p) => p.id !== product.id)
                  console.log('[ProductForm] Modal products:', {
                    allFeaturedCount: allFeaturedProducts.length,
                    frontendFeaturedCount: allProducts.filter(p => p.featured).length,
                    filteredCount: filtered.length,
                    products: filtered.map(p => ({ id: p.id, name: p.name, inStock: p.inStock }))
                  })
                  return filtered
                })().map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedProductToRemove === p.id
                          ? 'border-white bg-gray-800'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="removeFeatured"
                        value={p.id}
                        checked={selectedProductToRemove === p.id}
                        onChange={(e) => setSelectedProductToRemove(e.target.value)}
                        className="w-4 h-4"
                      />
                      <img
                        src={p.images[0] || '/placeholder.jpg'}
                        alt={p.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-400 text-sm">€{p.price.toFixed(2)}</p>
                          {!p.inStock && (
                            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleFeaturedConfirm}
                  disabled={!selectedProductToRemove}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowFeaturedModal(false)
                    setSelectedProductToRemove(null)
                    setFormData({ ...formData, featured: false })
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Save size={20} />
            Save Product
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// Analytics Tab Component
function AnalyticsTab() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const orders = await res.json()
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
        const pendingOrders = orders.filter((o: any) => o.status === 'pending').length
        const processingOrders = orders.filter((o: any) => o.status === 'processing').length
        const shippedOrders = orders.filter((o: any) => o.status === 'shipped').length

        setStats({
          totalOrders,
          totalRevenue,
          averageOrderValue,
          pendingOrders,
          processingOrders,
          shippedOrders,
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-thin text-white tracking-wider mb-8">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Orders</h3>
          <p className="text-white text-3xl font-light">{stats.totalOrders}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Revenue</h3>
          <p className="text-white text-3xl font-light">€{stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Average Order Value</h3>
          <p className="text-white text-3xl font-light">€{stats.averageOrderValue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Pending Orders</h3>
          <p className="text-yellow-400 text-3xl font-light">{stats.pendingOrders}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Processing Orders</h3>
          <p className="text-blue-400 text-3xl font-light">{stats.processingOrders}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Shipped Orders</h3>
          <p className="text-purple-400 text-3xl font-light">{stats.shippedOrders}</p>
        </div>
      </div>
    </div>
  )
}

// Customers Tab Component
function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.filter((u: any) => u.role === 'customer'))
      } else {
        toast.error('Failed to load customers')
      }
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">Customers</h2>
          <p className="text-gray-400 text-sm mt-1">
            Total: {customers.length} customers
          </p>
        </div>
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500 text-sm"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16">
          <Users size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">No customers found</h3>
          <p className="text-gray-400">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-light text-white mb-1">
                    {customer.name || 'No name'}
                  </h3>
                  <p className="text-gray-400 text-sm">{customer.email}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Joined: {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Fetch customer orders
                    fetch(`/api/orders`).then(res => res.json()).then(orders => {
                      const customerOrders = orders.filter((o: any) => o.userId === customer.id || o.user?.id === customer.id)
                      setSelectedCustomer({ ...customer, orders: customerOrders })
                    })
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-white">
                {selectedCustomer.name || 'Customer'}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Email</p>
                <p className="text-white">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Orders</p>
                <p className="text-white">{selectedCustomer.orders?.length || 0} orders</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// User Management Tab Component
function UserManagementTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    displayName: '',
    bio: '',
    location: '',
    verified: false,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      displayName: user.displayName || '',
      bio: user.bio || '',
      location: user.location || '',
      verified: user.verified || false,
    })
  }

  const handleSave = async () => {
    if (!editingUser) return

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        toast.success('User updated successfully')
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        const errorMsg = data.error || data.details || 'Failed to update user'
        console.error('User update error:', data)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error('User update exception:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }

  const handleRemoveAvatar = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user\'s profile picture?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeAvatar: true }),
      })

      if (res.ok) {
        toast.success('Profile picture removed')
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to remove profile picture')
      }
    } catch (error) {
      toast.error('Failed to remove profile picture')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">User Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage user accounts and profiles</p>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-black border border-gray-800 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all"
        />
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-white">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-800 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-800 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-gray-800 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-800 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={editForm.verified}
                  onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="verified" className="text-sm text-gray-300">Verified (Family & Friends)</label>
              </div>

              {editingUser.avatarUrl && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={editingUser.avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border border-gray-700"
                    />
                    <button
                      onClick={() => handleRemoveAvatar(editingUser.id)}
                      className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-400 rounded hover:bg-red-900/70 transition-colors"
                    >
                      Remove Picture
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || user.name}
                  className="w-16 h-16 rounded-full object-cover border border-gray-700"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-light text-white">
                    {user.displayName || user.name || 'No name'}
                  </h3>
                  {user.verified && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{user.email}</p>
                {user.bio && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{user.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-gray-500 text-xs">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                {user.avatarUrl && (
                  <button
                    onClick={() => handleRemoveAvatar(user.id)}
                    className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-400 rounded hover:bg-red-900/70 transition-colors text-sm"
                    title="Remove profile picture"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No users found</p>
        </div>
      )}
    </div>
  )
}

// Inventory Tab Component
function InventoryTab({ products, onUpdate }: { products: Product[], onUpdate: () => void }) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(0)

  useEffect(() => {
    // Products with quantity < 5 are considered low stock
    setLowStockProducts(products.filter(p => (p.quantity || 0) < 5))
  }, [products])

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQuantity,
          inStock: newQuantity > 0,
        }),
      })
      if (res.ok) {
        toast.success('Quantity updated')
        onUpdate()
        setEditingProduct(null)
      } else {
        toast.error('Failed to update quantity')
      }
    } catch (error) {
      toast.error('Failed to update quantity')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">Inventory</h2>
          <p className="text-gray-400 text-sm mt-1">
            Low stock items: {lowStockProducts.length} (threshold: &lt; 5)
          </p>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-medium mb-2">Low Stock Alert</h3>
          <p className="text-gray-400 text-sm">
            {lowStockProducts.length} product(s) have low stock levels.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gray-900 border rounded-lg p-4 ${
              (product.quantity || 0) < 5 ? 'border-yellow-500/30' : 'border-gray-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-medium">{product.name}</h3>
                <p className="text-gray-400 text-sm">{product.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Current Stock</p>
                  <p className={`text-lg font-medium ${
                    (product.quantity || 0) < 5 ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {product.quantity || 0}
                  </p>
                </div>
                {editingProduct?.id === product.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                      min="0"
                    />
                    <button
                      onClick={() => handleUpdateQuantity(product.id, quantity)}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingProduct(product)
                      setQuantity(product.quantity || 0)
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Update Stock
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Reviews Management Component
function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([])
  const [filteredReviews, setFilteredReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [selectedReview, setSelectedReview] = useState<any | null>(null)
  const [editingReview, setEditingReview] = useState<any>({
    title: '',
    content: '',
    rating: null,
    paymentMethod: '',
    imageUrl: '',
    approved: false,
  })

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/admin/reviews${filter !== 'all' ? `?filter=${filter}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setReviews(data)
        } else {
          console.error('Invalid reviews data:', data)
          setReviews([])
          if (data.error) {
            toast.error(data.error)
          }
        }
      } else {
        setReviews([])
        toast.error(data.error || 'Failed to load reviews')
      }
    } catch (error) {
      console.error('Failed to load reviews', error)
      setReviews([])
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    setFilteredReviews(reviews)
  }, [reviews])

  const handleApprove = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      if (res.ok) {
        toast.success('Review approved')
        fetchReviews()
      } else {
        toast.error('Failed to approve review')
      }
    } catch (error) {
      toast.error('Failed to approve review')
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Review deleted')
        fetchReviews()
        setSelectedReview(null)
      } else {
        toast.error('Failed to delete review')
      }
    } catch (error) {
      toast.error('Failed to delete review')
    }
  }

  const handleEdit = async () => {
    if (!selectedReview) return
    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview),
      })
      if (res.ok) {
        toast.success('Review updated')
        fetchReviews()
        setSelectedReview(null)
      } else {
        toast.error('Failed to update review')
      }
    } catch (error) {
      toast.error('Failed to update review')
    }
  }

  const [migrating, setMigrating] = useState(false)

  const handleRunMigration = async () => {
    if (!confirm('Run database migration? This will add the new review fields.')) return
    setMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Migration completed successfully!')
        fetchReviews()
      } else {
        toast.error(data.message || 'Migration failed')
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast.error('Failed to run migration')
    } finally {
      setMigrating(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'paypal_fnf': return 'PayPal (FNF)'
      case 'paypal_gs': return 'PayPal (GS)'
      case 'revolut': return 'Revolut'
      case 'website': return 'Website'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading reviews...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-thin text-white tracking-wider">Reviews</h2>
          <p className="text-gray-400 text-sm mt-1">
            Total: {reviews.length} reviews
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunMigration}
            disabled={migrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            {migrating ? 'Running Migration...' : 'Run Migration'}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved')}
            className="px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm"
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="all">All Reviews</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400">No reviews found.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">
                      {review.user?.displayName || review.user?.name || 'User'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      review.approved 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {review.approved ? 'Approved' : 'Pending'}
                    </span>
                    {review.verified && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                        ✓ Verified
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {getPaymentMethodLabel(review.paymentMethod)}
                    </span>
                    {review.order?.orderNumber && (
                      <span className="text-gray-500 text-xs">
                        Order: {review.order.orderNumber}
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h3 className="text-white text-lg mb-2">{review.title}</h3>
                  )}
                  <p className="text-gray-300 text-sm mb-2">{review.content}</p>
                  {review.rating && (
                    <div className="text-yellow-400 text-sm mb-2">{review.rating} ★</div>
                  )}
                  {review.imageUrl && (
                    <img src={review.imageUrl} alt="Review" className="max-w-xs h-auto rounded border border-gray-800 mt-2" />
                  )}
                  <div className="text-gray-500 text-xs mt-2">
                    {new Date(review.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedReview(review)
                      setEditingReview({
                        title: review.title || '',
                        content: review.content,
                        rating: review.rating || null,
                        paymentMethod: review.paymentMethod,
                        imageUrl: review.imageUrl || '',
                        approved: review.approved,
                      })
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  {!review.approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-white">Edit Review</h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editingReview.title}
                  onChange={(e) => setEditingReview({ ...editingReview, title: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={editingReview.content}
                  onChange={(e) => setEditingReview({ ...editingReview, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingReview.rating || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <select
                  value={editingReview.paymentMethod}
                  onChange={(e) => setEditingReview({ ...editingReview, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="paypal_fnf">PayPal (FNF)</option>
                  <option value="paypal_gs">PayPal (GS)</option>
                  <option value="revolut">Revolut</option>
                  <option value="website">Website</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="text"
                  value={editingReview.imageUrl}
                  onChange={(e) => setEditingReview({ ...editingReview, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                />
                {editingReview.imageUrl && (
                  <img src={editingReview.imageUrl} alt="Review" className="max-w-xs h-auto rounded border border-gray-800 mt-2" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="approved"
                  checked={editingReview.approved}
                  onChange={(e) => setEditingReview({ ...editingReview, approved: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="approved" className="text-sm text-gray-300">Approved</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleEdit}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

