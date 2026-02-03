'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_PRODUCTS, MOCK_ORDERS } from '@/lib/mock-data'
import { ShoppingBag, Heart, MapPin, Truck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export function CustomerDashboard() {
  const { user } = useAuth()
  const customerOrders = MOCK_ORDERS.slice(0, 3)
  const [wishlist] = useState<string[]>(['prod-1', 'prod-3'])

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back, {user?.name ?? 'there'}
          </h1>
          <p className="text-muted-foreground">Browse our products and track your orders</p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border cursor-pointer hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">My Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{customerOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/orders" className="text-primary hover:underline">
                View all orders
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border cursor-pointer hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Wishlist</CardTitle>
            <Heart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{wishlist.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/wishlist" className="text-primary hover:underline">
                View wishlist
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border cursor-pointer hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">In Transit</CardTitle>
            <Truck className="w-4 h-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-1">Orders on the way</p>
          </CardContent>
        </Card>
      </div>

      {/* My Orders */}
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
          <div className="space-y-4">
            {customerOrders.map((order) => (
              <div key={order.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
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

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.productName} x {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        KES {(item.subtotal / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Details */}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-foreground">KES {(order.total / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery To</p>
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.shippingAddress}
                    </p>
                  </div>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button variant="ghost" className="w-full mt-3 text-primary" size="sm">
                    Track Order
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Products */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Featured Products</CardTitle>
          <CardDescription>Check out our bestsellers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PRODUCTS.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-primary/50" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    KES {(product.price / 1000).toFixed(0)}K
                  </span>
                  <Button
                    size="sm"
                    variant={wishlist.includes(product.id) ? 'default' : 'outline'}
                    className={
                      wishlist.includes(product.id)
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : ''
                    }
                  >
                    {wishlist.includes(product.id) ? (
                      <>
                        <Heart className="w-4 h-4 mr-1" />
                        Saved
                      </>
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
