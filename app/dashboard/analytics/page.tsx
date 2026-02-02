'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MOCK_ANALYTICS, MOCK_ORDERS, MOCK_PRODUCTS } from '@/lib/mock-data'
import { Download, TrendingUp, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const { user } = useAuth()

  if (user?.role !== 'owner') {
    return (
      <div className="p-8">
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">This page is only available to business owners.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate order status breakdown
  const orderStatusData = [
    { name: 'Pending', value: MOCK_ORDERS.filter((o) => o.status === 'pending').length },
    { name: 'Processing', value: MOCK_ORDERS.filter((o) => o.status === 'processing').length },
    { name: 'Shipped', value: MOCK_ORDERS.filter((o) => o.status === 'shipped').length },
    { name: 'Delivered', value: MOCK_ORDERS.filter((o) => o.status === 'delivered').length },
  ]

  // Category breakdown
  const categoryRevenue = MOCK_PRODUCTS.reduce(
    (acc, product) => {
      const existing = acc.find((item) => item.name === product.category)
      if (existing) {
        existing.value += product.price * product.quantity
      } else {
        acc.push({ name: product.category, value: product.price * product.quantity })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const COLORS = [
    'var(--primary)',
    'var(--accent)',
    'var(--secondary)',
    'var(--chart-1)',
    'var(--chart-2)',
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Business Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and metrics</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              KES {(MOCK_ANALYTICS.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% vs last quarter
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              KES {(MOCK_ANALYTICS.averageOrderValue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">4.2%</div>
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +0.3% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Customer LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary-foreground">
              KES {(MOCK_ANALYTICS.averageOrderValue * 4.2).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Selector */}
      <Card className="border-border bg-card/50">
        <CardContent className="py-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Button variant="ghost" size="sm">
            Last 30 Days
          </Button>
          <Button variant="ghost" size="sm">
            Last 90 Days
          </Button>
          <Button variant="ghost" size="sm">
            This Year
          </Button>
          <Button variant="ghost" size="sm">
            Custom Range
          </Button>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_ANALYTICS.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => `KES ${(value / 1000000).toFixed(1)}M`}
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary)', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Order Status</CardTitle>
            <CardDescription>Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Category Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue by Category</CardTitle>
            <CardDescription>Sales performance by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Products */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Products</CardTitle>
            <CardDescription>Best selling products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ANALYTICS.topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge className="bg-primary/30 text-primary font-bold">#{idx + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      KES {((product.price * product.quantity) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-border bg-primary/5">
        <CardHeader>
          <CardTitle className="text-foreground">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Revenue Growth</p>
              <p className="text-sm text-muted-foreground">Your revenue has grown 12% compared to last month</p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Order Volume</p>
              <p className="text-sm text-muted-foreground">
                You have {pendingOrders} pending orders that need attention
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Inventory Health</p>
              <p className="text-sm text-muted-foreground">
                3 products have low stock and need immediate reordering
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const pendingOrders = MOCK_ORDERS.filter((o) => o.status === 'pending').length
