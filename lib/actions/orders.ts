'use server'

import type { OrderDto, OrderReviewDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function listOrders(): Promise<OrderDto[]> {
  const res = await backendFetch('/orders')
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function getOrder(id: string): Promise<OrderDto> {
  const res = await backendFetch(`/orders/${id}`)
  if (!res.ok) throw new Error('Failed to fetch order')
  return res.json()
}

export async function createOrder(body: {
  items: { productId: string; quantity: number }[]
  shippingAddress?: string
  deliveryMode: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'
  shippingFee?: number
  /** 'M-Pesa' or 'Cash'. Cash: seller confirms payment in the system. */
  paymentMethod?: 'M-Pesa' | 'Cash'
}): Promise<OrderDto> {
  const res = await backendFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to create order')
  }
  return res.json()
}

export type InitiatePaymentResult =
  | { ok: true; paymentId: string; checkoutRequestId: string; status: string; message: string }
  | { ok: false; error: string }

export async function initiatePayment(orderId: string, body: { phoneNumber: string }): Promise<InitiatePaymentResult> {
  const res = await backendFetch(`/orders/${orderId}/payments/initiate`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as { message?: string }).message || (data as { error?: string }).error || 'Failed to initiate payment'
    return { ok: false, error: message }
  }
  return { ok: true, ...(data as { paymentId: string; checkoutRequestId: string; status: string; message: string }) }
}

export async function confirmPayment(orderId: string, paymentId: string): Promise<{ status: string; paymentId: string }> {
  const res = await backendFetch(`/orders/${orderId}/payments/${paymentId}/confirm`, { method: 'PATCH' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to confirm payment')
  }
  return res.json()
}

/** Seller sets/updates delivery mode and address for an order (e.g. cash orders). Staff/owner only. */
export async function updateOrderDelivery(
  orderId: string,
  body: {
    deliveryMode: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'
    shippingAddress?: string
    pickupLocation?: string
    shippingFee?: number
  }
): Promise<OrderDto> {
  const res = await backendFetch(`/orders/${orderId}/delivery`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to update delivery')
  }
  return res.json()
}

/** Update payment method for a pending order (e.g. switch between M-Pesa and Cash). Customer only for their own orders. */
export async function updateOrderPaymentMethod(
  orderId: string,
  paymentId: string,
  paymentMethod: 'M-Pesa' | 'Cash'
): Promise<void> {
  const res = await backendFetch(`/orders/${orderId}/payments/${paymentId}/method`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentMethod }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to update payment method')
  }
}

export async function cancelOrder(orderId: string): Promise<OrderDto> {
  const res = await backendFetch(`/orders/${orderId}/cancel`, { method: 'PATCH' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to cancel order')
  }
  return res.json()
}

export async function getReviewForOrder(orderId: string): Promise<OrderReviewDto | null> {
  const res = await backendFetch(`/reviews/order/${orderId}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load review')
  }
  return res.json()
}

export async function createReview(orderId: string, rating: number, comment?: string): Promise<OrderReviewDto> {
  const res = await backendFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify({ orderId, rating, comment }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to submit review')
  }
  return res.json()
}
