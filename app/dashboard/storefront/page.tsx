'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { listProducts, listProductCategories, getMySellerConfig } from '@/lib/actions/products'
import { createOrder, initiatePayment } from '@/lib/actions/orders'
import type { ProductDto, ProductCategoryDto, OrderDto, SellerConfigDto } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ShoppingCart, Heart, Star, Filter, Loader2, Smartphone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const WISHLIST_STORAGE_KEY = 'biashara_wishlist'
const WISHLIST_CART_SEED_PREFIX = 'biashara_wishlist_cart_seed_'

interface CartItem {
  productId: string
  quantity: number
}

export default function StorefrontPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductDto[]>([])
  const [categories, setCategories] = useState<ProductCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('featured')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review')
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null)
  const [shippingAddress, setShippingAddress] = useState('')
  const [orderError, setOrderError] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'>(
    'SELLER_SELF',
  )
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash'>('M-Pesa')
  const [sellerConfig, setSellerConfig] = useState<SellerConfigDto | null>(null)

  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${user.id}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) setWishlist(parsed)
        }
      } catch {
        // ignore
      }
    }
  }, [user?.id])

  // Seed cart from wishlist "Add all to cart" action on wishlist page
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined' || products.length === 0) return
    const key = `${WISHLIST_CART_SEED_PREFIX}${user.id}`
    let raw: string | null = null
    try {
      raw = localStorage.getItem(key)
      if (!raw) return
      const ids: unknown = JSON.parse(raw)
      if (!Array.isArray(ids) || ids.length === 0) return

      setCart((prev) => {
        const quantities = new Map(prev.map((item) => [item.productId, item.quantity]))
        for (const id of ids as string[]) {
          const product = products.find((p) => p.id === id)
          if (!product || (product.quantity ?? 0) <= 0) continue
          const current = quantities.get(id) ?? 0
          quantities.set(id, current + 1)
        }
        return Array.from(quantities.entries()).map(([productId, quantity]) => ({
          productId,
          quantity,
        }))
      })
    } catch {
      // ignore parse errors
    } finally {
      if (raw !== null) {
        try {
          localStorage.removeItem(key)
        } catch {
          // ignore
        }
      }
    }
  }, [user?.id, products])

  // Load seller config for branding (for owner/staff storefront view).
  useEffect(() => {
    if (!user || (user.role !== 'owner' && user.role !== 'staff')) return
    getMySellerConfig()
      .then((cfg) => setSellerConfig(cfg))
      .catch(() => setSellerConfig(null))
  }, [user?.id, user?.role])

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
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      if (user?.id && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`${WISHLIST_STORAGE_KEY}_${user.id}`, JSON.stringify(next))
        } catch {
          // ignore
        }
      }
      return next
    })
  }

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product?.price ?? 0) * item.quantity
  }, 0)
  const grandTotal = cartTotal + shippingFee

  const computeShippingFee = (mode: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP') => {
    switch (mode) {
      case 'COURIER':
        return 300
      case 'RIDER_MARKETPLACE':
        return 200
      case 'CUSTOMER_PICKUP':
      case 'SELLER_SELF':
      default:
        return 0
    }
  }

  const handleCheckoutClick = () => {
    if (cart.length === 0) return
    setOrderError('')
    setPaymentError('')
    setShippingAddress('')
    setDeliveryMode('SELLER_SELF')
    setShippingFee(computeShippingFee('SELLER_SELF'))
    setCheckoutStep('review')
    setCreatedOrder(null)
    setPaymentInitiated(false)
    setMpesaPhone('')
    setPaymentMethod('M-Pesa')
    setCheckoutOpen(true)
  }

  const normalizeMpesaPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('254')) return digits
    if (digits.startsWith('0')) return '254' + digits.slice(1)
    if (digits.length >= 9) return '254' + digits.slice(-9)
    return digits
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)
    setOrderError('')
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
      const order = await createOrder({
        items,
        shippingAddress: shippingAddress.trim() || undefined,
        deliveryMode,
        shippingFee,
        paymentMethod,
      })
      setCreatedOrder(order)
      setCart([])
      setCheckoutStep('payment')
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleInitiatePayment = async () => {
    if (!createdOrder?.id || !mpesaPhone.trim()) {
      setPaymentError('Enter your M-Pesa phone number (e.g. 07XXXXXXXX or 254XXXXXXXXX)')
      return
    }
    if ((createdOrder.paymentMethod ?? paymentMethod) === 'Cash') {
      setPaymentError('This order is pay-by-cash. Use "View my orders" to track it.')
      return
    }
    setInitiatingPayment(true)
    setPaymentError('')
    try {
      const result = await initiatePayment(createdOrder.id, {
        phoneNumber: normalizeMpesaPhone(mpesaPhone.trim()),
      })
      if (!result.ok) {
        setPaymentError(result.error)
        return
      }
      setPaymentInitiated(true)
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Failed to send M-Pesa prompt')
    } finally {
      setInitiatingPayment(false)
    }
  }

  const handleViewOrders = () => {
    setCheckoutStep('review')
    setCreatedOrder(null)
    setPaymentInitiated(false)
    setCheckoutOpen(false)
    router.push('/dashboard/orders')
  }

  const handleCheckoutOpenChange = (open: boolean) => {
    if (!open) {
      if (checkoutStep === 'payment') return
      setCheckoutStep('review')
      setCreatedOrder(null)
      setPaymentInitiated(false)
      setPaymentError('')
    }
    setCheckoutOpen(open)
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${cart.length > 0 ? 'pb-28 safe-area-pb' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {sellerConfig?.brandingEnabled && sellerConfig.brandingName
              ? sellerConfig.brandingName
              : 'Browse Products'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {sellerConfig?.brandingEnabled
              ? 'White-labeled storefront for this seller, running on the BiasharaHub platform.'
              : 'Discover our handcrafted collection'}
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground relative w-full sm:w-auto"
          onClick={handleCheckoutClick}
        >
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
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-6xl">
            <div className="flex items-center gap-4 min-w-0">
              <p className="text-sm text-muted-foreground shrink-0">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
              <p className="text-xl sm:text-2xl font-bold text-primary truncate">KES {(cartTotal / 1000).toFixed(0)}K</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/90 text-foreground gap-2" asChild>
                <Link href="/dashboard/storefront">Continue Shopping</Link>
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={handleCheckoutClick}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Proceed to Checkout</span>
                <span className="sm:hidden">Checkout</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          if (!open && checkoutStep === 'payment') return
          handleCheckoutOpenChange(open)
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          {checkoutStep === 'review' ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Checkout</DialogTitle>
                <DialogDescription>
                  Review your order and add an optional shipping address. You will be asked to pay with M-Pesa before completing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Order summary</p>
                  <ul className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                    {cart.map((item) => {
                      const product = products.find((p) => p.id === item.productId)
                      const lineTotal = (product?.price ?? 0) * item.quantity
                      return (
                        <li key={item.productId} className="px-3 py-2 flex justify-between items-center gap-2 text-sm">
                          <span className="text-foreground truncate">
                            {product?.name ?? 'Product'} × {item.quantity}
                          </span>
                          <span className="font-medium text-primary shrink-0">
                            KES {(lineTotal / 1000).toFixed(0)}K
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2 flex justify-between">
                  <span>Items total</span>
                  <span className="font-bold text-foreground">KES {(cartTotal / 1000).toFixed(0)}K</span>
                  </p>
                <p className="text-sm text-muted-foreground mt-1 flex justify-between">
                  <span>Shipping fee</span>
                  <span className="font-bold text-foreground">
                    {shippingFee > 0 ? `KES ${(shippingFee / 1000).toFixed(1)}K` : 'Free'}
                  </span>
                </p>
                <p className="text-sm font-semibold mt-1 flex justify-between">
                  <span>Total (incl. shipping)</span>
                  <span className="font-bold text-foreground">KES {(grandTotal / 1000).toFixed(0)}K</span>
                </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Shipping address (optional)</label>
                  <Input
                    placeholder="Street, city, postal code"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Delivery method</p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMode-dashboard"
                        value="SELLER_SELF"
                        checked={deliveryMode === 'SELLER_SELF'}
                        onChange={() => {
                          setDeliveryMode('SELLER_SELF')
                          setShippingFee(computeShippingFee('SELLER_SELF'))
                        }}
                      />
                      <span className="text-sm text-foreground">Seller delivery (standard)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Free</span>
                  </label>
                  <label className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMode-dashboard"
                        value="COURIER"
                        checked={deliveryMode === 'COURIER'}
                        onChange={() => {}}
                        disabled
                      />
                      <span className="text-sm text-foreground">Courier delivery (coming soon)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">From KES 300</span>
                  </label>
                  <label className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMode-dashboard"
                        value="RIDER_MARKETPLACE"
                        checked={deliveryMode === 'RIDER_MARKETPLACE'}
                        onChange={() => {}}
                        disabled
                      />
                      <span className="text-sm text-foreground">Marketplace rider (coming soon)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">From KES 200</span>
                  </label>
                  <label className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMode-dashboard"
                        value="CUSTOMER_PICKUP"
                        checked={deliveryMode === 'CUSTOMER_PICKUP'}
                        onChange={() => {
                          setDeliveryMode('CUSTOMER_PICKUP')
                          setShippingFee(computeShippingFee('CUSTOMER_PICKUP'))
                        }}
                      />
                      <span className="text-sm text-foreground">Customer pickup</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Free</span>
                  </label>
                </div>
              </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Payment method</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 border border-border rounded-md px-3 py-2 cursor-pointer">
                      <input type="radio" name="paymentMethod-dashboard" checked={paymentMethod === 'M-Pesa'} onChange={() => setPaymentMethod('M-Pesa')} />
                      <span className="text-sm text-foreground">M-Pesa (pay now)</span>
                    </label>
                    <label className="flex items-center gap-3 border border-border rounded-md px-3 py-2 cursor-pointer">
                      <input type="radio" name="paymentMethod-dashboard" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} />
                      <span className="text-sm text-foreground">Cash (pay on delivery; seller confirms)</span>
                    </label>
                  </div>
                </div>
                {orderError && (
                  <p className="text-sm text-destructive">{orderError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={placingOrder}>
                  Cancel
                </Button>
                <Button onClick={handlePlaceOrder} disabled={placingOrder}>
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing order...
                    </>
                  ) : (
                    'Place order'
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {(() => {
                const effectivePaymentMethod = (createdOrder?.paymentMethod ?? paymentMethod) as 'M-Pesa' | 'Cash'
                const isCash = effectivePaymentMethod === 'Cash'
                return (
                  <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {isCash ? 'Order placed — Pay in cash' : 'Complete your order — Pay with M-Pesa'}
                </DialogTitle>
                <DialogDescription>
                  {isCash
                    ? 'Your order is placed. Pay the seller in cash when you receive. They will confirm payment in the system.'
                    : 'Your order is placed. Pay now to complete it. You will receive an M-Pesa prompt on your phone.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
                {createdOrder && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {isCash ? 'Amount to pay (in cash)' : 'Amount to pay'}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      KES {(Number(createdOrder.total) / 1000).toFixed(0)}K
                    </p>
                  </div>
                )}
                {isCash ? (
                  <p className="text-sm text-muted-foreground">
                    The seller will mark this order as paid once you pay in cash. You can track it under My orders.
                  </p>
                ) : !paymentInitiated ? (
                  <div>
                    <label className="text-sm font-medium text-foreground">M-Pesa phone number</label>
                    <Input
                      placeholder="07XXXXXXXX or 254XXXXXXXXX"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Complete payment on your phone</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your M-Pesa PIN on your phone. Payment status will update automatically when M-Pesa confirms—no need to do anything else here.
                      </p>
                    </div>
                  </div>
                )}
                {paymentError && (
                  <p className="text-sm text-destructive">{paymentError}</p>
                )}
              </div>
              <DialogFooter>
                {isCash ? (
                  <Button onClick={handleViewOrders}>
                    View my orders
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => {
                        setCheckoutStep('review')
                        setCreatedOrder(null)
                        setPaymentInitiated(false)
                        setCheckoutOpen(false)
                        router.push('/dashboard/orders')
                      }}
                      disabled={initiatingPayment}
                    >
                      I&apos;ll pay later
                    </Button>
                    {!paymentInitiated ? (
                      <Button onClick={handleInitiatePayment} disabled={initiatingPayment}>
                        {initiatingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 mr-2" />
                            Pay now to complete order
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button onClick={handleViewOrders}>
                        View my orders
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
                  </>
                )
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
