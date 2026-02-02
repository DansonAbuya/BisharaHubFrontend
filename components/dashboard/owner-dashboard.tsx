'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_ANALYTICS, MOCK_ORDERS, MOCK_PRODUCTS } from '@/lib/mock-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react'
import Link from 'next/link'

export function OwnerDashboard() {
  const [timeRange] = useState('month')

  // Calculate stats
  const lowStockProducts = MOCK_PRODUCTS.filter((p) => p.quantity <= 30)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Business Overview</h1>
          <p className="text-muted-foreground">Track your business performance and key metrics</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              KES {(MOCK_ANALYTICS.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {MOCK_ANALYTICS.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {MOCK_ANALYTICS.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              KES {(MOCK_ANALYTICS.averageOrderValue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_ANALYTICS.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `KES ${(value / 1000000).toFixed(1)}M`}
                  contentStyle={{ backgroundColor: 'var(--background)' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Low Stock Alert</CardTitle>
            <CardDescription>{lowStockProducts.length} products need restock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} units left
                      </p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">Reorder</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">All products well stocked</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ORDERS.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground text-sm">
                      KES {(order.total / 1000).toFixed(0)}K
                    </p>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ANALYTICS.topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/50 to-accent/50 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">KES {(product.price / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 rounded-full">
                    <p className="text-xs font-semibold text-primary">#{idx + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
