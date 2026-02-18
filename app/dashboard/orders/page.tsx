'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Eye, Filter, FileText, Loader2, Smartphone } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listOrders, initiatePayment, confirmPayment, cancelOrder, getReviewForOrder, createReview } from '@/lib/actions/orders'
import { getInvoiceHtml } from '@/lib/actions/reports'
import { createDispute } from '@/lib/actions/disputes'
import type { OrderDto, OrderReviewDto } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { PageHeader } from '@/components/layout/page-header'

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
  const [summaryConfirmed, setSummaryConfirmed] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [orderToCancel, setOrderToCancel] = useState<OrderDto | null>(null)
  const [selectedOrderReview, setSelectedOrderReview] = useState<OrderReviewDto | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [orderForDispute, setOrderForDispute] = useState<OrderDto | null>(null)
  const [disputeType, setDisputeType] = useState('other')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [disputeError, setDisputeError] = useState<string | null>(null)
  const [disputeSuccess, setDisputeSuccess] = useState(false)
  const [invoiceLoadingOrderId, setInvoiceLoadingOrderId] = useState<string | null>(null)
  const [confirmingCashOrderId, setConfirmingCashOrderId] = useState<string | null>(null)

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
    const isUnpaid = order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending'
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'unpaid'
          ? isUnpaid
          : order.status === filterStatus
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
    (isCustomerView ? order.customerId === user?.id && order.paymentMethod !== 'Cash' : false)

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

  const handleRequestCancelOrder = (order: OrderDto) => {
    setOrderToCancel(order)
  }

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return
    setCancellingOrderId(orderToCancel.id)
    setError(null)
    try {
      const updated = await cancelOrder(orderToCancel.id)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setOrderToCancel(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel order')
    } finally {
      setCancellingOrderId(null)
    }
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

  const handleConfirmCashPayment = async (orderId: string, paymentId: string) => {
    setConfirmingCashOrderId(orderId)
    try {
      await confirmPayment(orderId, paymentId)
      await listOrders().then(setOrders)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm cash payment')
    } finally {
      setConfirmingCashOrderId(null)
    }
  }

  const canLeaveReview = (order: OrderDto | null) => {
    if (!order || !isCustomerView) return false
    return order.status === 'delivered' && (order.paymentStatus ?? 'pending') === 'completed'
  }

  useEffect(() => {
    if (!isDetailOpen || !selectedOrder || !canLeaveReview(selectedOrder)) {
      setSelectedOrderReview(null)
      setReviewRating(0)
      setReviewComment('')
      setReviewError(null)
      return
    }
    setReviewLoading(true)
    setReviewError(null)
    getReviewForOrder(selectedOrder.id)
      .then((rev) => {
        if (rev) {
          setSelectedOrderReview(rev)
          setReviewRating(rev.rating)
          setReviewComment(rev.comment ?? '')
        } else {
          setSelectedOrderReview(null)
          setReviewRating(0)
          setReviewComment('')
        }
      })
      .catch((e) => {
        setReviewError(e instanceof Error ? e.message : 'Failed to load review')
      })
      .finally(() => setReviewLoading(false))
  }, [isDetailOpen, selectedOrder])

  const handleSubmitReview = async () => {
    if (!selectedOrder || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5.')
      return
    }
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const rev = await createReview(selectedOrder.id, reviewRating, reviewComment.trim() || undefined)
      setSelectedOrderReview(rev)
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const headerDescription = isCustomerView
    ? 'Track your purchases and delivery status.'
    : canActOnBehalf && customerFilter !== 'all'
      ? `Orders for ${customerList.find((c) => c.id === customerFilter)?.name ?? 'customer'}.`
      : 'View and manage all customer orders.'

  const headerActions = (
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
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PageHeader
        title={isCustomerView ? 'My Orders' : 'Order Management'}
        description={headerDescription}
        actions={headerActions}
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{ordersFilteredByCustomer.length}</div>
          </CardContent>
        </Card>

        <Card
          className={`border-border transition-colors ${isCustomerView ? 'cursor-pointer hover:bg-secondary/30' : ''} ${filterStatus === 'unpaid' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => isCustomerView && setFilterStatus('unpaid')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
              {isCustomerView ? 'Unpaid' : 'Pending'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-accent">
              {ordersFilteredByCustomer.filter((o) => o.status === 'pending' && (o.paymentStatus ?? 'pending') === 'pending').length}
            </div>
            {isCustomerView && (
              <p className="text-xs text-muted-foreground mt-1">Tap to filter and pay</p>
            )}
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
            {isCustomerView && (
              <option value="unpaid">Unpaid (pay now)</option>
            )}
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
                      setSummaryConfirmed(false)
                      setIsDetailOpen(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-secondary/50"
                    disabled={invoiceLoadingOrderId === order.id}
                    onClick={async () => {
                      if (!order.id) return
                      setInvoiceLoadingOrderId(order.id)
                      try {
                        const html = await getInvoiceHtml(order.id)
                        const w = window.open('', '_blank', 'noopener')
                        if (w) {
                          w.document.write(html)
                          w.document.close()
                        }
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to generate invoice')
                      } finally {
                        setInvoiceLoadingOrderId(null)
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {invoiceLoadingOrderId === order.id ? 'Generating…' : 'Invoice'}
                  </Button>
                  {isCustomerView && canPayOrder(order) && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleOpenPay(order)}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay now
                    </Button>
                  )}
                  {canActOnBehalf && order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending' && order.paymentMethod === 'Cash' && order.paymentId && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={confirmingCashOrderId === order.id}
                      onClick={() => handleConfirmCashPayment(order.id, order.paymentId!)}
                    >
                      {confirmingCashOrderId === order.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {confirmingCashOrderId === order.id ? 'Confirming…' : 'Confirm cash payment'}
                    </Button>
                  )}
                  {isCustomerView && order.customerId === user?.id && order.status !== 'cancelled' && order.status !== 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrderForDispute(order)
                        setDisputeDescription('')
                        setDisputeType('other')
                        setDisputeError(null)
                        setDisputeSuccess(false)
                      }}
                    >
                      Report problem
                    </Button>
                  )}
                  {order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending' && isCustomerView && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={cancellingOrderId === order.id}
                      onClick={() => handleRequestCancelOrder(order)}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling…' : 'Cancel order'}
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

              {/* Total and confirmation */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-foreground font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    KES {(Number(selectedOrder.total) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">Order summary confirmation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please review the customer, items, totals and shipping details above. Confirm the
                    summary to enable payment.
                  </p>
                  <Button
                    variant={summaryConfirmed ? 'outline' : 'default'}
                    size="sm"
                    className="mt-2"
                    onClick={() => setSummaryConfirmed(true)}
                    disabled={summaryConfirmed}
                  >
                    {summaryConfirmed ? 'Summary confirmed' : 'I have reviewed and confirm this summary'}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    setIsDetailOpen(false)
                    setSummaryConfirmed(false)
                    setSelectedOrderReview(null)
                    setReviewRating(0)
                    setReviewComment('')
                  }}
                >
                  Close
                </Button>
                {canPayOrder(selectedOrder) && (summaryConfirmed || (selectedOrder.paymentStatus ?? 'pending') === 'pending') && (
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
                <Button
                  variant="outline"
                  className="bg-transparent"
                  disabled={invoiceLoadingOrderId === selectedOrder?.id || !selectedOrder?.id}
                  onClick={async () => {
                    if (!selectedOrder?.id) return
                    setInvoiceLoadingOrderId(selectedOrder.id)
                    try {
                      const html = await getInvoiceHtml(selectedOrder.id)
                      const w = window.open('', '_blank', 'noopener')
                      if (w) {
                        w.document.write(html)
                        w.document.close()
                      }
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to generate invoice')
                    } finally {
                      setInvoiceLoadingOrderId(null)
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {invoiceLoadingOrderId === selectedOrder?.id ? 'Generating…' : 'Print Invoice'}
                </Button>
              </div>

              {/* Review & feedback */}
              {canLeaveReview(selectedOrder) && (
                <div className="mt-6 border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Share your feedback
                    </p>
                    {selectedOrderReview && (
                      <span className="text-xs text-muted-foreground">
                        You reviewed this order on {formatDate(selectedOrderReview.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rate your experience with this order to help sellers improve and to build trust
                    for other customers.
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-xl ${
                          reviewRating >= star ? 'text-yellow-500' : 'text-muted-foreground'
                        }`}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {reviewRating} / 5
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Comment (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      placeholder="What went well? What could be improved?"
                      disabled={reviewSubmitting}
                    />
                  </div>
                  {reviewError && (
                    <p className="text-xs text-destructive">{reviewError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || reviewLoading || !!selectedOrderReview && reviewRating === selectedOrderReview.rating && reviewComment === (selectedOrderReview.comment ?? '')}
                    >
                      {reviewSubmitting ? 'Submitting…' : selectedOrderReview ? 'Update review' : 'Submit review'}
                    </Button>
                  </div>
                </div>
              )}
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
      <ConfirmDialog
        open={!!orderToCancel}
        onOpenChange={(open) => {
          if (!open) setOrderToCancel(null)
        }}
        title="Cancel order"
        description="This will cancel your pending order and restore any reserved inventory. You cannot undo this action."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        confirmVariant="destructive"
        loading={!!cancellingOrderId}
        onConfirm={handleConfirmCancelOrder}
      />

      {/* Report problem / Open dispute */}
      <Dialog open={!!orderForDispute} onOpenChange={(open) => { if (!open) setOrderForDispute(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Report a problem</DialogTitle>
            <DialogDescription>
              Open a dispute for this order. Support will review and may contact the seller. You can add delivery proof (e.g. photo URL) if relevant.
            </DialogDescription>
          </DialogHeader>
          {orderForDispute && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                setDisputeError(null)
                setDisputeSubmitting(true)
                try {
                  await createDispute({
                    orderId: orderForDispute.id,
                    disputeType: disputeType,
                    description: disputeDescription.trim() || undefined,
                  })
                  setDisputeSuccess(true)
                  setTimeout(() => { setOrderForDispute(null); setDisputeSuccess(false) }, 2000)
                } catch (err) {
                  setDisputeError(err instanceof Error ? err.message : 'Failed to submit')
                } finally {
                  setDisputeSubmitting(false)
                }
              }}
            >
              {disputeSuccess && (
                <Alert className="bg-primary/10 border-primary/30">
                  <AlertDescription>Dispute submitted. Support will review.</AlertDescription>
                </Alert>
              )}
              {disputeError && (
                <Alert variant="destructive">
                  <AlertDescription>{disputeError}</AlertDescription>
                </Alert>
              )}
              <div>
                <label className="text-sm font-medium text-foreground">Problem type</label>
                <Select value={disputeType} onValueChange={setDisputeType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="late_shipping">Late shipping</SelectItem>
                    <SelectItem value="wrong_item">Wrong item</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  className="mt-1"
                  placeholder="Describe what went wrong..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOrderForDispute(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={disputeSubmitting}>
                  {disputeSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit dispute'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
