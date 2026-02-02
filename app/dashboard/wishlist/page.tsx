'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { Heart, ShoppingCart, Share2, Trash2 } from 'lucide-react'

export default function WishlistPage() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<string[]>(['prod-1', 'prod-3', 'prod-5'])

  const wishlistItems = MOCK_PRODUCTS.filter((p) => wishlist.includes(p.id))

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId))
  }

  const totalValue = wishlistItems.reduce((sum, p) => sum + p.price, 0)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">Save your favorite items for later</p>
        </div>
        {wishlist.length > 0 && (
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
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((product) => (
            <Card key={product.id} className="border-border overflow-hidden hover:shadow-lg transition">
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                <ShoppingCart className="w-16 h-16 text-primary/30" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-accent"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </Button>
              </div>

              {/* Product Info */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className="bg-primary/30 text-primary text-xs">
                    {product.category}
                  </Badge>
                  <Badge className="bg-secondary/30 text-foreground">
                    {product.quantity} left
                  </Badge>
                </div>
                <CardTitle className="text-lg text-foreground line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">
                    KES {(product.price / 1000).toFixed(0)}K
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                  >
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
