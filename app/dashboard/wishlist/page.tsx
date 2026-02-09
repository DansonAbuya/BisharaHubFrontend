'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listProducts, type ProductDto } from '@/lib/api'
import { Heart, ShoppingCart, Share2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const WISHLIST_STORAGE_KEY = 'biashara_wishlist'

const MOCK_CUSTOMERS = [
  { id: 'cust-1', name: 'Jane Mwangi' },
  { id: 'cust-2', name: 'Ahmed Hassan' },
  { id: 'cust-3', name: 'Sarah Okonkwo' },
  { id: 'cust-4', name: 'Amina Patel' },
]

// Mock wishlists per customer (for owner/staff "on behalf" view)
const MOCK_CUSTOMER_WISHLISTS: Record<string, string[]> = {
  'cust-1': ['prod-1', 'prod-3'],
  'cust-2': ['prod-2', 'prod-4'],
  'cust-3': ['prod-1', 'prod-5'],
  'cust-4': ['prod-3', 'prod-4', 'prod-5'],
}

export default function WishlistPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const isCustomerView = user?.role === 'customer'
  const canActOnBehalf = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin'
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(canActOnBehalf ? 'cust-1' : '')
  const [ownWishlist, setOwnWishlist] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    listProducts()
      .then((data) => { if (!cancelled) setProducts(data) })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user?.id || !isCustomerView || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${user.id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setOwnWishlist(parsed)
      }
    } catch {
      // ignore
    }
  }, [user?.id, isCustomerView])

  const wishlist = isCustomerView || !canActOnBehalf
    ? ownWishlist
    : (MOCK_CUSTOMER_WISHLISTS[selectedCustomerId] ?? [])
  const wishlistItems = products.filter((p) => wishlist.includes(p.id))

  const removeFromWishlist = (productId: string) => {
    if (isCustomerView || !canActOnBehalf) {
      setOwnWishlist((prev) => {
        const next = prev.filter((id) => id !== productId)
        if (user?.id && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`${WISHLIST_STORAGE_KEY}_${user.id}`, JSON.stringify(next))
          } catch {
            // ignore
          }
        }
        return next
      })
    } else {
      // On-behalf view: mock only; in real app would call API
      setSelectedCustomerId((id) => id)
    }
  }

  const totalValue = wishlistItems.reduce((sum, p) => sum + p.price, 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isCustomerView ? 'My Wishlist' : canActOnBehalf ? 'Wishlist (on behalf of customer)' : 'My Wishlist'}
          </h1>
          <p className="text-muted-foreground">
            {isCustomerView ? 'Save your favorite items for later' : 'View or manage a customer\'s saved items'}
          </p>
        </div>
        {canActOnBehalf && (
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 text-sm">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CUSTOMERS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(isCustomerView || !canActOnBehalf) && wishlist.length > 0 && (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add All to Cart
          </Button>
        )}
      </div>

      {/* Wishlist Stats */}
      {wishlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Items Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{wishlist.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                KES {(totalValue / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Average Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                KES {(totalValue / wishlist.length / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wishlist Items */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((product) => (
            <Card key={product.id} className="border-border overflow-hidden hover:shadow-lg transition">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                {product.image ? (
                  <Image src={product.image} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <ShoppingCart className="w-16 h-16 text-primary/30" />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-accent"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </Button>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className="bg-primary/30 text-primary text-xs">
                    {product.category || 'Uncategorized'}
                  </Badge>
                  <Badge className="bg-secondary/30 text-foreground">
                    {(product.quantity ?? 0)} left
                  </Badge>
                </div>
                <CardTitle className="text-lg text-foreground line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">
                    KES {(product.price / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Your wishlist is empty</p>
            <p className="text-muted-foreground text-sm mb-4">
              Save products to your wishlist to view them later
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
