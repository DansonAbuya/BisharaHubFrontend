'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MOCK_ORDERS } from '@/lib/mock-data'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Download, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MOCK_CUSTOMERS = [
  { id: 'cust-1', name: 'Jane Mwangi' },
  { id: 'cust-2', name: 'Ahmed Hassan' },
  { id: 'cust-3', name: 'Sarah Okonkwo' },
  { id: 'cust-4', name: 'Amina Patel' },
]

export default function OrdersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<string>('all')

  const isCustomerView = user?.role === 'customer'
  const canActOnBehalf = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin'

  const orders = useMemo(() => {
    let list = isCustomerView ? MOCK_ORDERS.slice(0, 3) : MOCK_ORDERS
    if (canActOnBehalf && customerFilter !== 'all') {
      list = list.filter((o) => o.customerId === customerFilter)
    }
    return list
  }, [isCustomerView, canActOnBehalf, customerFilter])

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || order.status === filterStatus
    return matchSearch && matchStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/30 text-accent'
      case 'confirmed':
        return 'bg-primary/30 text-primary'
      case 'processing':
        return 'bg-accent/30 text-accent'
      case 'shipped':
        return 'bg-secondary/30 text-foreground'
      case 'delivered':
        return 'bg-primary/30 text-primary'
      case 'cancelled':
        return 'bg-destructive/30 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/30 text-primary'
      case 'pending':
        return 'bg-accent/30 text-accent'
      case 'failed':
        return 'bg-destructive/30 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {isCustomerView ? 'My Orders' : 'Order Management'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isCustomerView
              ? 'Track your purchases and delivery status'
              : canActOnBehalf && customerFilter !== 'all'
                ? `Orders for ${MOCK_CUSTOMERS.find((c) => c.id === customerFilter)?.name ?? 'customer'}`
                : 'View and manage all customer orders'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {canActOnBehalf && (
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-9 text-sm">
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {MOCK_CUSTOMERS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isCustomerView && (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-accent">
              {orders.filter((o) => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden sm:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-secondary-foreground">
              {orders.filter((o) => o.status === 'shipped' || o.status === 'processing').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {orders.filter((o) => o.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <Input
          placeholder="Search order ID or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1 text-sm"
        />

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-border bg-background text-foreground flex-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button variant="outline" className="h-10 gap-2 bg-transparent text-sm px-3">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">More</span>
          </Button>
        </div>
      </div>

      {/* Orders Table/List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Orders</CardTitle>
          <CardDescription>{filteredOrders.length} orders found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">{order.orderId}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {order.customerName}
                      {order.customerEmail && ` • ${order.customerEmail}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-primary">
                      KES {(order.total / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Status and Payment */}
                <div className="flex flex-wrap gap-2 mb-3 py-2 border-y border-border">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Badge className={getPaymentColor(order.paymentStatus)}>
                    Payment: {order.paymentStatus}
                  </Badge>
                  {order.paymentMethod && (
                    <Badge className="bg-secondary/30 text-foreground">
                      {order.paymentMethod}
                    </Badge>
                  )}
                </div>

                {/* Items Summary */}
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-foreground">
                        {item.productName} x {item.quantity} = KES {(item.subtotal / 1000).toFixed(0)}K
                      </p>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Shipping to:</p>
                    <p className="text-sm font-medium text-foreground">{order.shippingAddress}</p>
                  </div>
                )}

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10"
                  onClick={() => {
                    setSelectedOrder(order)
                    setIsDetailOpen(true)
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-foreground font-medium">No orders found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedOrder?.orderId}</DialogTitle>
            <DialogDescription>Complete order details and timeline</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge className={getPaymentColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="font-semibold text-foreground mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-foreground">{item.productName}</span>
                      <span className="text-foreground font-medium">
                        x{item.quantity} = KES {(item.subtotal / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <p className="text-foreground font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    KES {(selectedOrder.total / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
