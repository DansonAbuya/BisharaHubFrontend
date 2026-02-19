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
import { listOrders, initiatePayment, confirmPayment, cancelOrder, getReviewForOrder, createReview, updateOrderPaymentMethod, updateOrderDelivery } from '@/lib/actions/orders'
import { listShipmentsByOrder } from '@/lib/actions/shipments'
import { getInvoiceHtml } from '@/lib/actions/reports'
import { createDispute } from '@/lib/actions/disputes'
import type { OrderDto, OrderReviewDto, ShipmentDto } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { PageHeader } from '@/components/layout/page-header'
import { PageLoading } from '@/components/layout/page-loading'
import { formatPrice } from '@/lib/utils'

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
  const [updatingPaymentMethodOrderId, setUpdatingPaymentMethodOrderId] = useState<string | null>(null)
  const [shipmentsByOrderId, setShipmentsByOrderId] = useState<Record<string, ShipmentDto[]>>({})
  const [shipmentsLoadingOrderId, setShipmentsLoadingOrderId] = useState<string | null>(null)
  const [deliveryModeEdit, setDeliveryModeEdit] = useState<'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'>('SELLER_SELF')
  const [deliveryShippingAddress, setDeliveryShippingAddress] = useState('')
  const [deliveryPickupLocation, setDeliveryPickupLocation] = useState('')
  const [deliverySavingOrderId, setDeliverySavingOrderId] = useState<string | null>(null)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [cashConfirmDialogOpen, setCashConfirmDialogOpen] = useState(false)
  const [cashConfirmOrder, setCashConfirmOrder] = useState<OrderDto | null>(null)

  const isCustomerView = user?.role === 'customer'
  const canActOnBehalf = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin'

  /** Order primary id (backend may return id or orderId). */
  const getOrderId = (o: OrderDto) => o.id || (o as { orderId?: string }).orderId || ''

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    listOrders()
      .then((o) => {
        setOrders(o)
        // For seller: ensure shipment data for confirmed orders (triggers backend ensure for cash-confirmed)
        if (user.role !== 'customer' && o.length > 0) {
          const confirmed = o.filter((ord) => ord.status === 'confirmed')
          const idOf = (ord: OrderDto) => ord.id || (ord as { orderId?: string }).orderId || ''
          Promise.all(confirmed.map((ord) => listShipmentsByOrder(idOf(ord))))
            .then((results) => {
              const next: Record<string, ShipmentDto[]> = {}
              confirmed.forEach((ord, i) => {
                const id = idOf(ord)
                if (id) next[id] = results[i] ?? []
              })
              setShipmentsByOrderId((prev) => ({ ...prev, ...next }))
            })
            .catch(() => {})
        }
      })
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
    getOrderId(order) &&
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

  useEffect(() => {
    if (!selectedOrder) return
    setDeliveryError(null)
    const mode = (selectedOrder.deliveryMode as 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP') || 'SELLER_SELF'
    setDeliveryModeEdit(mode)
    setDeliveryShippingAddress(selectedOrder.shippingAddress ?? '')
    const oid = getOrderId(selectedOrder)
    const shipments = oid ? (shipmentsByOrderId[oid] ?? []) : []
    const first = shipments[0]
    setDeliveryPickupLocation(first?.pickupLocation ?? '')
  }, [selectedOrder, shipmentsByOrderId])

  useEffect(() => {
    if (!cashConfirmOrder) return
    const mode = (cashConfirmOrder.deliveryMode as 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP') || 'SELLER_SELF'
    setDeliveryModeEdit(mode)
    setDeliveryShippingAddress(cashConfirmOrder.shippingAddress ?? '')
    const oid = getOrderId(cashConfirmOrder)
    const shipments = oid ? (shipmentsByOrderId[oid] ?? []) : []
    setDeliveryPickupLocation(shipments[0]?.pickupLocation ?? '')
  }, [cashConfirmOrder, shipmentsByOrderId])

  const handleSaveDelivery = async () => {
    if (!selectedOrder) return
    const oid = getOrderId(selectedOrder)
    if (!oid) return
    setDeliverySavingOrderId(oid)
    setDeliveryError(null)
    try {
      const updated = await updateOrderDelivery(oid, {
        deliveryMode: deliveryModeEdit,
        shippingAddress: deliveryModeEdit === 'CUSTOMER_PICKUP' ? undefined : (deliveryShippingAddress.trim() || undefined),
        pickupLocation: deliveryModeEdit === 'CUSTOMER_PICKUP' ? (deliveryPickupLocation.trim() || undefined) : undefined,
      })
      setOrders((prev) => prev.map((o) => (getOrderId(o) === oid ? updated : o)))
      setSelectedOrder(updated)
      const list = await listShipmentsByOrder(oid)
      setShipmentsByOrderId((prev) => ({ ...prev, [oid]: list }))
    } catch (e) {
      setDeliveryError(e instanceof Error ? e.message : 'Failed to update delivery')
    } finally {
      setDeliverySavingOrderId(null)
    }
  }

  const handleRequestCancelOrder = (order: OrderDto) => {
    setOrderToCancel(order)
  }

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return
    const oid = getOrderId(orderToCancel)
    setCancellingOrderId(oid)
    setError(null)
    try {
      const updated = await cancelOrder(oid)
      setOrders((prev) => prev.map((o) => (getOrderId(o) === getOrderId(updated) ? updated : o)))
      setOrderToCancel(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel order')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const handleInitiatePayment = async () => {
    if (!payOrder || !getOrderId(payOrder) || !mpesaPhone.trim()) {
      setPaymentError('Enter your M-Pesa phone number (e.g. 07XXXXXXXX or 254XXXXXXXXX)')
      return
    }
    if (payOrder.paymentMethod === 'Cash') {
      setPaymentError('This order is pay-by-cash. The seller will confirm when you pay in cash.')
      return
    }
    setInitiatingPayment(true)
    setPaymentError('')
    try {
      const result = await initiatePayment(getOrderId(payOrder), { phoneNumber: normalizeMpesaPhone(mpesaPhone.trim()) })
      if (!result.ok) {
        setPaymentError(result.error)
        return
      }
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

  const handleUpdatePaymentMethod = async (orderId: string, paymentId: string, newMethod: 'M-Pesa' | 'Cash') => {
    setUpdatingPaymentMethodOrderId(orderId)
    setError(null)
    try {
      await updateOrderPaymentMethod(orderId, paymentId, newMethod)
      const updatedList = await listOrders()
      setOrders(updatedList)
      const updated = updatedList.find((o) => getOrderId(o) === orderId)
      if (selectedOrder && getOrderId(selectedOrder) === orderId && updated) setSelectedOrder(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update payment method')
    } finally {
      setUpdatingPaymentMethodOrderId(null)
    }
  }

  const openCashConfirmDialog = (order: OrderDto) => {
    setCashConfirmOrder(order)
    setDeliveryError(null)
    setCashConfirmDialogOpen(true)
  }

  const handleConfirmCashPaymentWithDelivery = async () => {
    if (!cashConfirmOrder || !cashConfirmOrder.paymentId) return
    const orderId = getOrderId(cashConfirmOrder)
    setConfirmingCashOrderId(orderId)
    try {
      await confirmPayment(orderId, cashConfirmOrder.paymentId, {
        deliveryMode: deliveryModeEdit,
        shippingAddress: deliveryModeEdit !== 'CUSTOMER_PICKUP' ? (deliveryShippingAddress.trim() || undefined) : undefined,
        pickupLocation: deliveryModeEdit === 'CUSTOMER_PICKUP' ? (deliveryPickupLocation.trim() || undefined) : undefined,
      })
      const [updatedList, shipmentList] = await Promise.all([
        listOrders(),
        listShipmentsByOrder(orderId),
      ])
      setOrders(updatedList)
      setShipmentsByOrderId((prev) => ({ ...prev, [orderId]: shipmentList }))
      if (selectedOrder && getOrderId(selectedOrder) === orderId) {
        const updated = updatedList.find((o) => getOrderId(o) === orderId)
        if (updated) setSelectedOrder(updated)
      }
      setCashConfirmDialogOpen(false)
      setCashConfirmOrder(null)
    } catch (e) {
      setDeliveryError(e instanceof Error ? e.message : 'Failed to confirm cash payment')
    } finally {
      setConfirmingCashOrderId(null)
    }
  }

  const handleConfirmCashPayment = async (orderId: string, paymentId: string) => {
    const order = orders.find((o) => getOrderId(o) === orderId) ?? selectedOrder
    if (order && getOrderId(order) === orderId) {
      openCashConfirmDialog(order)
    } else {
      setConfirmingCashOrderId(orderId)
      try {
        await confirmPayment(orderId, paymentId)
        const [updatedList, shipmentList] = await Promise.all([
          listOrders(),
          listShipmentsByOrder(orderId),
        ])
        setOrders(updatedList)
        setShipmentsByOrderId((prev) => ({ ...prev, [orderId]: shipmentList }))
        if (selectedOrder && getOrderId(selectedOrder) === orderId) {
          const updated = updatedList.find((o) => getOrderId(o) === orderId)
          if (updated) setSelectedOrder(updated)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to confirm cash payment')
      } finally {
        setConfirmingCashOrderId(null)
      }
    }
  }

  const canLeaveReview = (order: OrderDto | null) => {
    if (!order || !isCustomerView) return false
    return order.status === 'delivered' && (order.paymentStatus ?? 'pending') === 'completed'
  }

  // When seller opens order detail for a confirmed order, ensure we have shipment data (triggers backend ensure for cash-confirmed)
  useEffect(() => {
    if (!isDetailOpen || !selectedOrder || selectedOrder.status !== 'confirmed') return
    const oid = getOrderId(selectedOrder)
    if (!oid || shipmentsByOrderId[oid] !== undefined) return
    setShipmentsLoadingOrderId(oid)
    listShipmentsByOrder(oid)
      .then((list) => setShipmentsByOrderId((prev) => ({ ...prev, [oid]: list })))
      .catch(() => setShipmentsByOrderId((prev) => ({ ...prev, [oid]: [] })))
      .finally(() => setShipmentsLoadingOrderId(null))
  }, [isDetailOpen, selectedOrder])

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
    getReviewForOrder(getOrderId(selectedOrder))
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
      const rev = await createReview(getOrderId(selectedOrder), reviewRating, reviewComment.trim() || undefined)
      setSelectedOrderReview(rev)
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading orders…" minHeight="200px" />
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
                key={getOrderId(order)}
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
                      {formatPrice(Number(order.total))}
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

                {/* Cash payment hint for customer */}
                {isCustomerView && order.paymentMethod === 'Cash' && order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending' && (
                  <p className="text-sm text-muted-foreground mb-2 rounded-md bg-muted/50 px-2 py-1.5">
                    Pay in cash to the seller; they will confirm payment in the system once received.
                  </p>
                )}
                {/* Items Summary */}
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items?.map((item, idx) => (
                      <p key={idx} className="text-sm text-foreground">
                        {item.productName} x {item.quantity} = {formatPrice(Number(item.subtotal))}
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
                    disabled={invoiceLoadingOrderId === getOrderId(order)}
                    onClick={async () => {
                      const oid = getOrderId(order)
                      if (!oid) return
                      setInvoiceLoadingOrderId(oid)
                      try {
                        const html = await getInvoiceHtml(oid)
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
                    {invoiceLoadingOrderId === getOrderId(order) ? 'Generating…' : 'Invoice'}
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
                  {isCustomerView && order.customerId === user?.id && order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending' && order.paymentId && (
                    <>
                      {order.paymentMethod === 'Cash' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingPaymentMethodOrderId === getOrderId(order)}
                          onClick={() => handleUpdatePaymentMethod(getOrderId(order), order.paymentId!, 'M-Pesa')}
                        >
                          {updatingPaymentMethodOrderId === getOrderId(order) ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Pay by M-Pesa instead
                        </Button>
                      )}
                      {order.paymentMethod !== 'Cash' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingPaymentMethodOrderId === getOrderId(order)}
                          onClick={() => handleUpdatePaymentMethod(getOrderId(order), order.paymentId!, 'Cash')}
                        >
                          {updatingPaymentMethodOrderId === getOrderId(order) ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Pay by cash instead
                        </Button>
                      )}
                    </>
                  )}
                  {canActOnBehalf && order.status === 'pending' && (order.paymentStatus ?? 'pending') === 'pending' && order.paymentMethod === 'Cash' && order.paymentId && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={confirmingCashOrderId === getOrderId(order)}
                      onClick={() => handleConfirmCashPayment(getOrderId(order), order.paymentId!)}
                    >
                      {confirmingCashOrderId === getOrderId(order) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {confirmingCashOrderId === getOrderId(order) ? 'Confirming…' : 'Confirm cash payment'}
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
                      disabled={cancellingOrderId === getOrderId(order)}
                      onClick={() => handleRequestCancelOrder(order)}
                    >
                      {cancellingOrderId === getOrderId(order) ? 'Cancelling…' : 'Cancel order'}
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
                {selectedOrder.paymentMethod && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment method</p>
                    <p className="font-medium text-foreground">{selectedOrder.paymentMethod}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="font-semibold text-foreground mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {(selectedOrder.items ?? []).map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-foreground">{item.productName}</span>
                      <span className="text-foreground font-medium">
                        x{item.quantity} = {formatPrice(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipment journey (for confirmed orders; backend ensures shipment for cash-confirmed) */}
              {selectedOrder.status === 'confirmed' && (
                <div>
                  <p className="font-semibold text-foreground mb-3">Shipment</p>
                  {shipmentsLoadingOrderId === getOrderId(selectedOrder) ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading shipment…
                    </p>
                  ) : (shipmentsByOrderId[getOrderId(selectedOrder)] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No shipment record yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(shipmentsByOrderId[getOrderId(selectedOrder)] ?? []).map((s) => {
                        const status = (s.status || '').toUpperCase()
                        const labels: Record<string, string> = {
                          CREATED: 'Awaiting dispatch',
                          SHIPPED: 'Dispatched',
                          IN_TRANSIT: 'In transit',
                          OUT_FOR_DELIVERY: 'Out for delivery',
                          DELIVERED: 'Delivered',
                          COLLECTED: 'Collected',
                        }
                        const statusLabel = labels[status] || status?.replace(/_/g, ' ') || '—'
                        return (
                          <div key={s.id} className="rounded-md border border-border bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Badge
                                className={
                                  status === 'CREATED'
                                    ? 'bg-accent/30 text-accent'
                                    : ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)
                                      ? 'bg-secondary/30 text-foreground'
                                      : ['DELIVERED', 'COLLECTED'].includes(status)
                                        ? 'bg-primary/30 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                }
                              >
                                {statusLabel}
                              </Badge>
                              {s.trackingNumber && (
                                <span className="text-xs text-muted-foreground">Tracking: {s.trackingNumber}</span>
                              )}
                            </div>
                            {(s.carrier || s.riderName || s.riderVehicle) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {[s.carrier, s.riderName, s.riderVehicle].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Set delivery (seller: for confirmed orders, e.g. cash – decide where/how to ship) */}
              {canActOnBehalf && selectedOrder.status === 'confirmed' && (
                <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                  <p className="font-semibold text-foreground">Set delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Choose how to fulfill this order: ship to an address, use a courier, or customer pickup.
                  </p>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Delivery method</label>
                    <Select
                      value={deliveryModeEdit}
                      onValueChange={(v) => setDeliveryModeEdit(v as typeof deliveryModeEdit)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELLER_SELF">Seller delivery</SelectItem>
                        <SelectItem value="COURIER">Courier</SelectItem>
                        <SelectItem value="RIDER_MARKETPLACE">Rider / marketplace</SelectItem>
                        <SelectItem value="CUSTOMER_PICKUP">Customer pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {deliveryModeEdit === 'CUSTOMER_PICKUP' ? (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Pickup location</label>
                      <Input
                        placeholder="Address or place where customer collects"
                        value={deliveryPickupLocation}
                        onChange={(e) => setDeliveryPickupLocation(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Shipping / delivery address</label>
                      <Input
                        placeholder="Street, city, postal code"
                        value={deliveryShippingAddress}
                        onChange={(e) => setDeliveryShippingAddress(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  {deliveryError && (
                    <Alert variant="destructive">
                      <AlertDescription>{deliveryError}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={deliverySavingOrderId === getOrderId(selectedOrder)}
                    onClick={handleSaveDelivery}
                  >
                    {deliverySavingOrderId === getOrderId(selectedOrder) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save delivery
                  </Button>
                </div>
              )}

              {/* Total and confirmation */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-foreground font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(Number(selectedOrder.total))}
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
                {canActOnBehalf && selectedOrder.status === 'pending' && (selectedOrder.paymentStatus ?? 'pending') === 'pending' && selectedOrder.paymentMethod === 'Cash' && selectedOrder.paymentId && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={confirmingCashOrderId === getOrderId(selectedOrder)}
                    onClick={() => handleConfirmCashPayment(getOrderId(selectedOrder), selectedOrder.paymentId!)}
                  >
                    {confirmingCashOrderId === getOrderId(selectedOrder) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Confirm cash payment
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="bg-transparent"
                  disabled={!selectedOrder || invoiceLoadingOrderId === getOrderId(selectedOrder) || !getOrderId(selectedOrder)}
                  onClick={async () => {
                    if (!selectedOrder || !getOrderId(selectedOrder)) return
                    setInvoiceLoadingOrderId(getOrderId(selectedOrder))
                    try {
                      const html = await getInvoiceHtml(getOrderId(selectedOrder))
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
                  {invoiceLoadingOrderId === (selectedOrder && getOrderId(selectedOrder)) ? 'Generating…' : 'Print Invoice'}
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

      {/* Confirm cash payment: prompt delivery mode before creating shipment */}
      <Dialog open={cashConfirmDialogOpen} onOpenChange={(open) => { if (!open) { setCashConfirmDialogOpen(false); setCashConfirmOrder(null); setDeliveryError(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm delivery & payment</DialogTitle>
            <DialogDescription>
              Set how this order will be delivered, then confirm that you received the cash payment. A shipment will be created with these details.
            </DialogDescription>
          </DialogHeader>
          {cashConfirmOrder && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">Order {cashConfirmOrder.orderId || getOrderId(cashConfirmOrder)}</p>
                <p className="text-xl font-bold text-primary mt-1">{formatPrice(Number(cashConfirmOrder.total))}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Delivery method</label>
                <Select value={deliveryModeEdit} onValueChange={(v) => setDeliveryModeEdit(v as typeof deliveryModeEdit)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELLER_SELF">Seller delivery</SelectItem>
                    <SelectItem value="COURIER">Courier</SelectItem>
                    <SelectItem value="RIDER_MARKETPLACE">Rider / marketplace</SelectItem>
                    <SelectItem value="CUSTOMER_PICKUP">Customer pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deliveryModeEdit === 'CUSTOMER_PICKUP' ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Pickup location</label>
                  <Input
                    placeholder="Address or place where customer collects"
                    value={deliveryPickupLocation}
                    onChange={(e) => setDeliveryPickupLocation(e.target.value)}
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Shipping / delivery address</label>
                  <Input
                    placeholder="Street, city, postal code"
                    value={deliveryShippingAddress}
                    onChange={(e) => setDeliveryShippingAddress(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              {deliveryError && (
                <Alert variant="destructive">
                  <AlertDescription>{deliveryError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setCashConfirmDialogOpen(false); setCashConfirmOrder(null) }} disabled={!!confirmingCashOrderId}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!cashConfirmOrder || !cashConfirmOrder.paymentId || confirmingCashOrderId === (cashConfirmOrder && getOrderId(cashConfirmOrder))}
              onClick={handleConfirmCashPaymentWithDelivery}
            >
              {cashConfirmOrder && confirmingCashOrderId === getOrderId(cashConfirmOrder) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm payment & delivery
            </Button>
          </div>
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
                  {formatPrice(Number(payOrder.total))}
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
