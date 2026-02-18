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

export async function initiatePayment(orderId: string, body: { phoneNumber: string }): Promise<{
  paymentId: string
  checkoutRequestId: string
  status: string
  message: string
}> {
  const res = await backendFetch(`/orders/${orderId}/payments/initiate`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to initiate payment')
  }
  return res.json()
}

export async function confirmPayment(orderId: string, paymentId: string): Promise<{ status: string; paymentId: string }> {
  const res = await backendFetch(`/orders/${orderId}/payments/${paymentId}/confirm`, { method: 'PATCH' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to confirm payment')
  }
  return res.json()
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
