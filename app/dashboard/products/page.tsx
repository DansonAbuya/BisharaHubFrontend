'use client'

/**
 * Sellers center: products page. Owner/staff must only see and manage products that belong to their business.
 * Backend is expected to scope product list by business for owner/staff; customers use businessId to see a specific shop's products.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  listProducts,
  listProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '@/lib/actions/products'
import type { ProductDto, ProductCategoryDto } from '@/lib/api'
import { Plus, Edit2, Trash2, BarChart3, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductDto[]>([])
  const [categories, setCategories] = useState<ProductCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form state for add/edit
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formImages, setFormImages] = useState<string[]>([])
  const [formMainImage, setFormMainImage] = useState<string | null>(null)

  const loadProducts = async () => {
    try {
      setError(null)
      const data = await listProducts()
      setProducts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await listProductCategories()
      setCategories(data)
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-destructive/30 text-destructive' }
    if (quantity <= 20) return { label: 'Low Stock', color: 'bg-accent/30 text-accent' }
    if (quantity <= 50) return { label: 'Medium Stock', color: 'bg-secondary/30 text-foreground' }
    return { label: 'Well Stocked', color: 'bg-primary/30 text-primary' }
  }

  const resetForm = () => {
    setFormName('')
    setFormCategory('')
    setFormDescription('')
    setFormPrice('')
    setFormQuantity('')
    setFormImages([])
    setFormMainImage(null)
    setEditingProduct(null)
  }

  const openAddDialog = () => {
    resetForm()
    if (categories.length > 0) setFormCategory(categories[0].name)
    if (categories.length === 0) loadCategories()
    setIsAddOpen(true)
  }

  const openEditDialog = (product: ProductDto) => {
    setEditingProduct(product)
    setFormName(product.name)
    setFormCategory(product.category || '')
    setFormDescription(product.description || '')
    setFormPrice(String(product.price))
    setFormQuantity(String(product.quantity ?? 0))
    setFormImages(product.images && product.images.length > 0 ? [...product.images] : [])
    setFormMainImage(product.image || (product.images && product.images[0]) || null)
    setIsAddOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)
      const { url } = await uploadProductImage(formData)
      setFormImages((prev) => (prev.includes(url) ? prev : [...prev, url]))
      if (!formMainImage) setFormMainImage(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const removeFormImage = (url: string) => {
    setFormImages((prev) => prev.filter((u) => u !== url))
    if (formMainImage === url) setFormMainImage(formImages[0] ?? null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(formPrice)
    const quantity = parseInt(formQuantity, 10)
    if (Number.isNaN(price) || price < 0) {
      setError('Please enter a valid price')
      return
    }
    if (Number.isNaN(quantity) || quantity < 0) {
      setError('Please enter a valid quantity')
      return
    }
    setFormSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory.trim() || null,
        description: formDescription.trim() || null,
        price,
        quantity,
        image: formMainImage || undefined,
        images: formImages.length > 0 ? formImages : undefined,
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
      } else {
        await createProduct(payload)
      }
      await loadProducts()
      setIsAddOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteProduct(id)
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const canManage = user?.role === 'owner' || user?.role === 'staff'

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {user?.role === 'customer' ? 'Products' : 'Inventory Management'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.role === 'customer' ? 'Browse all available products' : 'Manage products and inventory'}
          </p>
        </div>
        {canManage && (
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{products.length}</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-accent">
                  {products.filter((p) => p.quantity <= 20 && p.quantity > 0).length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border hidden sm:block">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-destructive">
                  {products.filter((p) => p.quantity === 0).length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border hidden lg:block">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  KES {(products.reduce((sum, p) => sum + p.price * (p.quantity ?? 0), 0) / 1_000_000).toFixed(1)}M
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 flex-1 text-sm"
            />
            <Button variant="outline" className="gap-2 bg-transparent text-sm h-10">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Products</CardTitle>
              <CardDescription>{filteredProducts.length} products available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.quantity ?? 0)
                  return (
                    <div
                      key={product.id}
                      className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0 flex items-start gap-3">
                          {product.image && (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image
                                src={product.image}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{product.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{product.description || '—'}</p>
                          </div>
                        </div>
                        <Badge className="bg-primary/30 text-primary text-xs w-fit">{product.category || 'Uncategorized'}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 py-3 border-y border-border mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-semibold text-foreground text-sm">KES {(product.price / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Stock</p>
                          <p className="font-semibold text-foreground text-sm">{product.quantity ?? 0}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground">Total Value</p>
                          <p className="font-semibold text-foreground text-sm">
                            KES {(((product.price ?? 0) * (product.quantity ?? 0)) / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                        {canManage && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary h-8 px-2"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit2 className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1 text-xs">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-8 px-2"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                            >
                              {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              <span className="hidden sm:inline ml-1 text-xs">Delete</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {canManage && (
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); resetForm(); } }}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>Add or update a product in your inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Product Name</label>
                <Input
                  placeholder="Enter product name"
                  className="mt-1 h-10 text-sm"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  placeholder="Enter product description"
                  className="w-full mt-1 p-3 rounded-md border border-border bg-background text-foreground text-sm"
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Product Image(s)</label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-10 text-sm flex-1"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP. Max 20MB. Upload then add product.</p>
                {formImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formImages.map((url) => (
                      <div key={url} className="relative group">
                        <div className="w-16 h-16 rounded border border-border overflow-hidden bg-muted">
                          <Image src={url} alt="" width={64} height={64} className="object-cover w-full h-full" unoptimized />
                        </div>
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                          onClick={() => removeFormImage(url)}
                        >
                          ×
                        </button>
                        {formMainImage === url && (
                          <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center">Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Price (KES)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Price"
                    className="mt-1 h-10 text-sm"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Quantity</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Qty"
                    className="mt-1 h-10 text-sm"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent text-sm"
                  onClick={() => { setIsAddOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingProduct ? 'Update' : 'Add') + ' Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
