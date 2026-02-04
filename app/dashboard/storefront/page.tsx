'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { listProducts, listProductCategories, type ProductDto, type ProductCategoryDto } from '@/lib/api'
import { ShoppingCart, Heart, Star, Filter, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface CartItem {
  productId: string
  quantity: number
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [categories, setCategories] = useState<ProductCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [productList, categoryList] = await Promise.all([
          listProducts(),
          listProductCategories(),
        ])
        if (!cancelled) {
          setProducts(productList)
          setCategories(categoryList)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchSearch && matchCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product?.price ?? 0) * item.quantity
  }, 0)

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Browse Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Discover our handcrafted collection</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground relative w-full sm:w-auto">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
              {cart.length}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <Button variant="outline" className="h-10 gap-2 bg-transparent text-sm">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
          <span className="sm:hidden">Filters</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className={`cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background border-border hover:bg-secondary'
          }`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Badge>
        {categories.map((c) => (
          <Badge
            key={c.id}
            variant={selectedCategory === c.name ? 'default' : 'outline'}
            className={`cursor-pointer ${
              selectedCategory === c.name
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border-border hover:bg-secondary'
            }`}
            onClick={() => setSelectedCategory(c.name)}
          >
            {c.name}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedProducts.map((product) => (
            <Card key={product.id} className="border-border overflow-hidden hover:shadow-lg transition">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <ShoppingCart className="w-16 h-16 text-primary/30" />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-accent"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                  />
                </Button>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className="bg-primary/30 text-primary text-xs">
                    {product.category || 'Uncategorized'}
                  </Badge>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < 4 ? 'fill-accent text-accent' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                </div>
                <CardTitle className="text-lg text-foreground line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      KES {(product.price / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(product.quantity ?? 0)} in stock
                    </p>
                  </div>
                  {(product.quantity ?? 0) <= 10 && (
                    <Badge className="bg-accent/30 text-accent">Limited</Badge>
                  )}
                </div>
                <Button
                  onClick={() => addToCart(product.id)}
                  disabled={(product.quantity ?? 0) === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {(product.quantity ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sortedProducts.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">No products found</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {cart.length > 0 && (
        <Card className="border-border bg-primary/5 sticky bottom-4">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{cart.length} items in cart</p>
              <p className="text-2xl font-bold text-primary">KES {(cartTotal / 1000).toFixed(0)}K</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button href="/dashboard/storefront" className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/90 text-foreground gap-2">
                Continue Shopping
              </Button>
              <Button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Proceed to Checkout</span>
                <span className="sm:hidden">Checkout</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
