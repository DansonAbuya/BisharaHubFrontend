'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Heart, MapPin, Truck, Loader2, ShoppingCart, Store } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listProducts, listBusinesses } from '@/lib/actions/products'
import { listOrders } from '@/lib/actions/orders'
import type { ProductDto, OrderDto, BusinessDto } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { formatPrice } from '@/lib/utils'

const TIER_LABELS: Record<string, string> = {
  tier1: 'Informal',
  tier2: 'Registered SME',
  tier3: 'Corporate',
}

const WISHLIST_STORAGE_KEY = 'biashara_wishlist'

function formatOrderDate(createdAt: string) {
  try {
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return createdAt
  }
}

export function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [shops, setShops] = useState<BusinessDto[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [featuredProducts, setFeaturedProducts] = useState<ProductDto[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    listOrders()
      .then((data) => { if (!cancelled) setOrders(data) })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    let cancelled = false
    listBusinesses()
      .then((data) => { if (!cancelled) setShops(data) })
      .catch(() => { if (!cancelled) setShops([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${user.id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setWishlist(parsed)
      }
    } catch {
      // ignore
    }
  }, [user?.id])

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

  useEffect(() => {
    if (!selectedShopId) {
      setFeaturedProducts([])
      return
    }
    let cancelled = false
    setProductsLoading(true)
    listProducts({ businessId: selectedShopId })
      .then((data) => { if (!cancelled) setFeaturedProducts(data) })
      .catch(() => { if (!cancelled) setFeaturedProducts([]) })
      .finally(() => { if (!cancelled) setProductsLoading(false) })
    return () => { cancelled = true }
  }, [selectedShopId])

  if (ordersLoading) {
    return <PageLoading message="Loading dashboard…" minHeight="280px" />
  }

  const recentOrders = orders.slice(0, 3)
  const inTransitCount = orders.filter(
    (o) => o.status === 'shipped' || o.status === 'processing',
  ).length

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name ?? 'there'}`}
        description="Browse verified shops, keep an eye on your orders, and manage your wishlist."
        actions={
          <Link href="/shop">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue Shopping
            </Button>
          </Link>
        }
      />

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/orders">
          <Card className="border-border cursor-pointer hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">My Orders</CardTitle>
              <ShoppingBag className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {ordersLoading ? '—' : orders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-primary hover:underline">
                View all orders
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/wishlist">
          <Card className="border-border cursor-pointer hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Wishlist</CardTitle>
              <Heart className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{wishlist.length}</div>
              <p className="text-xs text-muted-foreground mt-1 text-primary hover:underline">
                View wishlist
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/orders">
          <Card className="border-border cursor-pointer hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">In Transit</CardTitle>
              <Truck className="w-4 h-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {ordersLoading ? '—' : inTransitCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Orders on the way</p>
            </CardContent>
          </Card>
        </Link>
        </div>
      </PageSection>

      <PageSection>
        <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
            <CardDescription>Your recent purchase history</CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No orders yet. <Link href="/shop" className="text-primary hover:underline">Continue shopping</Link> to place your first order.
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{order.orderId || order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge
                        className={
                          order.status === 'pending'
                            ? 'bg-accent/30 text-accent'
                            : order.status === 'delivered'
                              ? 'bg-primary/30 text-primary'
                              : 'bg-secondary/30 text-foreground'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>

                    {(order.items?.length ?? 0) > 0 && (
                      <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-foreground">
                              {item.productName} x {item.quantity}
                            </span>
                            <span className="font-medium text-foreground">
                              {formatPrice(Number(item.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-foreground">
                          {formatPrice(Number(order.total))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery To</p>
                        <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {order.shippingAddress || '—'}
                        </p>
                      </div>
                    </div>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <Link href="/dashboard/orders" className="block mt-3">
                        <Button variant="ghost" className="w-full text-primary" size="sm">
                          Track Order
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Store className="w-5 h-5" />
              Products
            </CardTitle>
            <CardDescription>
              {selectedShopId
                ? `Viewing products from ${shops.find((s) => s.id === selectedShopId)?.name ?? 'shop'}`
                : 'Select a shop to see its products and place orders'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedShopId && (
              <Button variant="outline" size="sm" onClick={() => setSelectedShopId('')}>
                Change shop
              </Button>
            )}
            <Link href="/shop">
              <Button variant="outline" size="sm">
                Browse all in Shop
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedShopId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose a shop to view its products</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((shop) => {
                  const tierLabel = TIER_LABELS[(shop.sellerTier || 'tier1').toLowerCase()] ?? shop.sellerTier
                  return (
                    <Card
                      key={shop.id}
                      className="border-border cursor-pointer hover:shadow-md hover:border-primary/50 transition"
                      onClick={() => setSelectedShopId(shop.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base text-foreground">{shop.name}</CardTitle>
                          {tierLabel && (
                            <Badge variant="outline" className="text-xs shrink-0">{tierLabel}</Badge>
                          )}
                        </div>
                        <CardDescription>{shop.ownerName}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-primary">
                          View products →
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {shops.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No shops available yet.</p>
              )}
            </div>
          ) : productsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No products in this shop yet. Try another shop or <Link href="/shop" className="text-primary hover:underline">browse the shop page</Link>.
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  {product.image ? (
                    <Image src={product.image} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-primary/50" />
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description || '—'}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(Number(product.price))}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={wishlist.includes(product.id) ? 'secondary' : 'outline'}
                      className="shrink-0"
                      onClick={() => toggleWishlist(product.id)}
                    >
                      {wishlist.includes(product.id) ? (
                        <>
                          <Heart className="w-4 h-4 mr-1 fill-current" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Link
                      href={
                        product.businessId
                          ? `/shop?businessId=${encodeURIComponent(product.businessId)}`
                          : '/shop'
                      }
                    >
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                        <ShoppingCart className="w-4 h-4" />
                        Add to cart
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}
