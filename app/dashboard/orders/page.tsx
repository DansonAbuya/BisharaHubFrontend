'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Download, Filter, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listOrders, initiatePayment, type OrderDto } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone } from 'lucide-react'

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [payOrder, setPayOrder] = useState<OrderDto | null>(null)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [initiatingPayment, setInitiatingPayment] = useState(false)

  const isCustomerView = user?.role === 'customer'
  const canActOnBehalf = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin'

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [user])

  const customerList = useMemo(() => {
    const seen = new Set<string>()
    return orders
      .filter((o) => o.customerId && !seen.has(o.customerId) && (seen.add(o.customerId), true))
      .map((o) => ({ id: o.customerId, name: o.customerName || o.customerEmail || o.customerId }))
  }, [orders])

  const ordersFilteredByCustomer = useMemo(() => {
    if (!canActOnBehalf || customerFilter === 'all') return orders
    return orders.filter((o) => o.customerId === customerFilter)
  }, [orders, canActOnBehalf, customerFilter])

  const filteredOrders = ordersFilteredByCustomer.filter((order) => {
    const orderIdStr = (order.orderId || order.id || '').toLowerCase()
    const customerStr = (order.customerName || order.customerEmail || '').toLowerCase()
    const matchSearch =
      !searchTerm.trim() ||
      orderIdStr.includes(searchTerm.toLowerCase()) ||
      customerStr.includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || order.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatDate = (createdAt: string) => {
    try {
      return new Date(createdAt).toLocaleDateString()
    } catch {
      return createdAt
    }
  }

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

  const canPayOrder = (order: OrderDto) =>
    (order.paymentStatus ?? 'pending') === 'pending' &&
    order.id &&
    order.paymentId &&
    (isCustomerView ? order.customerId === user?.id : false)

  const normalizeMpesaPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('254')) return digits
    if (digits.startsWith('0')) return '254' + digits.slice(1)
    if (digits.length >= 9) return '254' + digits.slice(-9)
    return digits
  }

  const handleOpenPay = (order: OrderDto) => {
    setPayOrder(order)
    setMpesaPhone('')
    setPaymentInitiated(false)
    setPaymentError('')
  }

  const handleInitiatePayment = async () => {
    if (!payOrder?.id || !mpesaPhone.trim()) {
      setPaymentError('Enter your M-Pesa phone number (e.g. 07XXXXXXXX or 254XXXXXXXXX)')
      return
    }
    setInitiatingPayment(true)
    setPaymentError('')
    try {
      await initiatePayment(payOrder.id, { phoneNumber: normalizeMpesaPhone(mpesaPhone.trim()) })
      setPaymentInitiated(true)
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Failed to send M-Pesa prompt')
    } finally {
      setInitiatingPayment(false)
    }
  }

  const handleRefreshOrders = () => {
    listOrders().then(setOrders).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
                ? `Orders for ${customerList.find((c) => c.id === customerFilter)?.name ?? 'customer'}`
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
                {customerList.map((c) => (
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
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{ordersFilteredByCustomer.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-accent">
              {ordersFilteredByCustomer.filter((o) => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden sm:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-secondary-foreground">
              {ordersFilteredByCustomer.filter((o) => o.status === 'shipped' || o.status === 'processing').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {ordersFilteredByCustomer.filter((o) => o.status === 'delivered').length}
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
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {order.orderId || order.id}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {order.customerName}
                      {order.customerEmail && ` • ${order.customerEmail}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-primary">
                      KES {(Number(order.total) / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Status and Payment */}
                <div className="flex flex-wrap gap-2 mb-3 py-2 border-y border-border">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Badge className={getPaymentColor(order.paymentStatus ?? 'pending')}>
                    Payment: {order.paymentStatus ?? 'pending'}
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
                    {order.items?.map((item, idx) => (
                      <p key={idx} className="text-sm text-foreground">
                        {item.productName} x {item.quantity} = KES {(Number(item.subtotal) / 1000).toFixed(0)}K
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
                <div className="flex flex-wrap gap-2">
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
                  {canPayOrder(order) && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleOpenPay(order)}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay
                    </Button>
                  )}
                </div>
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
            <DialogTitle className="text-foreground">{selectedOrder?.orderId || selectedOrder?.id}</DialogTitle>
            <DialogDescription>Complete order details and timeline</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{selectedOrder.customerName || selectedOrder.customerEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold text-foreground">
                    {formatDate(selectedOrder.createdAt)}
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
                  <Badge className={getPaymentColor(selectedOrder.paymentStatus ?? 'pending')}>
                    {selectedOrder.paymentStatus ?? 'pending'}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="font-semibold text-foreground mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {(selectedOrder.items ?? []).map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-foreground">{item.productName}</span>
                      <span className="text-foreground font-medium">
                        x{item.quantity} = KES {(Number(item.subtotal) / 1000).toFixed(0)}K
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
                    KES {(Number(selectedOrder.total) / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button variant="outline" className="bg-transparent" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                {canPayOrder(selectedOrder) && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setIsDetailOpen(false)
                      handleOpenPay(selectedOrder)
                    }}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay with M-Pesa
                  </Button>
                )}
                <Button variant="outline" className="bg-transparent">
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay with M-Pesa dialog */}
      <Dialog open={!!payOrder} onOpenChange={(open) => { if (!open) setPayOrder(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Pay with M-Pesa</DialogTitle>
            <DialogDescription>
              You will receive an M-Pesa STK push on your phone to complete payment.
            </DialogDescription>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">Order {payOrder.orderId || payOrder.id}</p>
                <p className="text-xl font-bold text-primary mt-1">
                  KES {(Number(payOrder.total) / 1000).toFixed(0)}K
                </p>
              </div>
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
                        Enter your M-Pesa PIN. Payment status will update automatically when M-Pesa confirms. You can close this and refresh your orders to check.
                      </p>
                    </div>
                  </div>
                )}
              {paymentError && (
                <p className="text-sm text-destructive">{paymentError}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayOrder(null)} disabled={initiatingPayment}>
              Cancel
            </Button>
            {payOrder && (
              !paymentInitiated ? (
                <Button onClick={handleInitiatePayment} disabled={initiatingPayment}>
                  {initiatingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay with M-Pesa
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleRefreshOrders}>
                    Refresh status
                  </Button>
                  <Button onClick={() => setPayOrder(null)}>
                    Done
                  </Button>
                </>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
