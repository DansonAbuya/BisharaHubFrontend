'use client'

/**
 * Public shop: shops (verified businesses) are visible to any customer, grouped by tier.
 * Products are shown only for the shop the customer selects. No sign-in required to browse;
 * add to cart / checkout prompt sign in or sign up.
 */
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import {
  listBusinesses,
  listProducts,
  listProductCategories,
  createOrder,
  initiatePayment,
  type BusinessDto,
  type ProductDto,
  type ProductCategoryDto,
  type OrderDto,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { ShoppingCart, Heart, Star, Filter, Loader2, Store, Smartphone } from 'lucide-react'

interface CartItem {
  productId: string
  quantity: number
}

const RETURN_URL = '/shop'

const TIER_LABELS: Record<string, string> = {
  tier1: 'Informal',
  tier2: 'Registered SME',
  tier3: 'Corporate',
}
const WISHLIST_STORAGE_KEY = 'biashara_wishlist'

function groupShopsByTier(shops: BusinessDto[]): { tier: string; label: string; shops: BusinessDto[] }[] {
  const byTier: Record<string, BusinessDto[]> = {}
  for (const shop of shops) {
    const t = (shop.sellerTier || 'tier1').toLowerCase()
    if (!byTier[t]) byTier[t] = []
    byTier[t].push(shop)
  }
  const order = ['tier1', 'tier2', 'tier3']
  return order
    .filter((t) => byTier[t]?.length)
    .map((t) => ({ tier: t, label: TIER_LABELS[t] || t, shops: byTier[t] }))
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [shops, setShops] = useState<BusinessDto[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductDto[]>([])
  const [categories, setCategories] = useState<ProductCategoryDto[]>([])
  const [shopsLoading, setShopsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('featured')
  const [signInPromptOpen, setSignInPromptOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review')
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null)
  const [shippingAddress, setShippingAddress] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'>(
    'SELLER_SELF',
  )
  const [shippingFee, setShippingFee] = useState(0)

  const shopsByTier = useMemo(() => groupShopsByTier(shops), [shops])
  const selectedShop = useMemo(() => shops.find((s) => s.id === selectedShopId), [shops, selectedShopId])

  useEffect(() => {
    const id = searchParams.get('businessId')
    setSelectedShopId(id || null)
  }, [searchParams])

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${user.id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setWishlist(parsed)
      }
    } catch {
      // ignore
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [shopList, categoryList] = await Promise.all([
          listBusinesses(),
          listProductCategories(),
        ])
        if (!cancelled) {
          setShops(shopList)
          setCategories(categoryList)
        }
      } catch {
        if (!cancelled) setShops([])
      } finally {
        if (!cancelled) setShopsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedShopId) {
      setProducts([])
      return
    }
    let cancelled = false
    setProductsLoading(true)
    listProducts({ businessId: selectedShopId })
      .then((list) => {
        if (!cancelled) setProducts(list)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedShopId])

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
    if (!user) {
      setSignInPromptOpen(true)
      return
    }
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
    if (!user) {
      setSignInPromptOpen(true)
      return
    }
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
    if (!user) {
      setSignInPromptOpen(true)
      return
    }
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
    if (!user || cart.length === 0) return
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
    setInitiatingPayment(true)
    setPaymentError('')
    try {
      await initiatePayment(createdOrder.id, {
        phoneNumber: normalizeMpesaPhone(mpesaPhone.trim()),
      })
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
    window.location.href = '/dashboard/orders'
  }

  const handleCheckoutOpenChange = (open: boolean) => {
    if (!open) {
      if (checkoutStep === 'payment') {
        // Require user to choose "Pay now" or "I'll pay later" instead of closing by click/escape
        return
      }
      setCheckoutStep('review')
      setCreatedOrder(null)
      setPaymentInitiated(false)
      setPaymentError('')
    }
    setCheckoutOpen(open)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm z-10 safe-area-pt">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-14 min-h-[56px] flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0 min-h-[44px] items-center">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={32} height={32} className="sm:w-9 sm:h-9" />
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
            {user ? (
              <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                  <Link href={`/login?returnUrl=${encodeURIComponent(RETURN_URL)}`}>Log in</Link>
                </Button>
                <Button size="sm" className="min-h-[44px]" asChild>
                  <Link href={`/signup?returnUrl=${encodeURIComponent(RETURN_URL)}`}>Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 ${cart.length > 0 ? 'pb-24 sm:pb-6 safe-area-pb' : ''}`}>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
              {selectedShop ? selectedShop.name : 'Shops'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedShop
                ? `Browse and order from ${selectedShop.name}. Sign in to add to cart and pay with M-Pesa.`
                : 'Select a verified shop to see its products. Grouped by seller tier.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {selectedShopId && (
              <Button variant="outline" onClick={() => setSelectedShopId(null)} className="min-h-[44px]">
                Change shop
              </Button>
            )}
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] relative"
              onClick={handleCheckoutClick}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary-foreground text-primary text-xs font-semibold">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {!selectedShopId && (
          <>
            {shopsLoading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading shops…</p>
                </div>
              </div>
            ) : shopsByTier.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-16 sm:py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Store className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No shops yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Verified businesses will appear here by tier.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-10">
                {shopsByTier.map(({ tier, label, shops: tierShops }) => (
                  <section key={tier}>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                      {label} · {tierShops.length} shop{tierShops.length !== 1 ? 's' : ''}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tierShops.map((shop) => (
                        <Card
                          key={shop.id}
                          className="border-border bg-card hover:shadow-md hover:border-primary/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedShopId(shop.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {shop.name}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs shrink-0 font-normal">
                                {label}
                              </Badge>
                            </div>
                            {shop.ownerName && (
                              <CardDescription className="text-sm">{shop.ownerName}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <span className="text-sm font-medium text-primary">View products →</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {selectedShopId && (
          <>
            {/* Toolbar: search, sort, filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="shop-search" className="sr-only">Search products</label>
                  <Input
                    id="shop-search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <label htmlFor="shop-sort" className="sr-only">Sort by</label>
                  <select
                    id="shop-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-11 px-4 rounded-md border border-border bg-background text-foreground text-sm min-w-[160px]"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A–Z</option>
                  </select>
                  <Button variant="outline" className="h-11 gap-2" type="button" aria-label="Filters">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1">
                  {productsLoading ? '…' : sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    className={`cursor-pointer min-h-[32px] ${
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
                      className={`cursor-pointer min-h-[32px] ${
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
              </div>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading products…</p>
                </div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-16 sm:py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No products match</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                    Try a different search term or category, or choose another shop.
                  </p>
                  <Button variant="outline" onClick={() => setSelectedShopId(null)}>
                    Back to shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sortedProducts.map((product) => (
                  <Card key={product.id} className="border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all flex flex-col">
                    <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-sm"
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                        aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                        />
                      </Button>
                    </div>
                    <CardHeader className="pb-2 flex-1">
                      <Badge className="w-fit bg-primary/10 text-primary text-xs mb-2">
                        {product.category || 'Uncategorized'}
                      </Badge>
                      <CardTitle className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-1">
                        {product.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xl font-bold text-primary">
                            KES {(product.price / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(product.quantity ?? 0)} in stock
                          </p>
                        </div>
                        {(product.quantity ?? 0) > 0 && (product.quantity ?? 0) <= 10 && (
                          <Badge variant="secondary" className="text-xs">Limited</Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => addToCart(product.id)}
                        disabled={(product.quantity ?? 0) === 0}
                        className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {(product.quantity ?? 0) === 0 ? 'Out of stock' : 'Add to cart'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-pb">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <p className="text-sm text-muted-foreground shrink-0">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
                <p className="text-xl sm:text-2xl font-bold text-primary truncate">KES {(cartTotal / 1000).toFixed(0)}K</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" asChild className="flex-1 sm:flex-none">
                  <Link href="/shop">Continue Shopping</Link>
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
      </main>

      <SignInPrompt open={signInPromptOpen} onOpenChange={setSignInPromptOpen} returnUrl={RETURN_URL} />

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
                          name="deliveryMode"
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
                          name="deliveryMode"
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
                          name="deliveryMode"
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
                          name="deliveryMode"
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
              <DialogHeader>
                <DialogTitle className="text-foreground">Complete your order — Pay with M-Pesa</DialogTitle>
                <DialogDescription>
                  Your order is placed. Pay now to complete it. You will receive an M-Pesa prompt on your phone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
                {createdOrder && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground">Amount to pay</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      KES {(Number(createdOrder.total) / 1000).toFixed(0)}K
                    </p>
                  </div>
                )}
                {!paymentInitiated ? (
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
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    setCheckoutStep('review')
                    setCreatedOrder(null)
                    setPaymentInitiated(false)
                    setCheckoutOpen(false)
                    window.location.href = '/dashboard/orders'
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
