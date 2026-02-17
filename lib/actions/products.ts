'use server'

import type { BusinessDto, ProductDto, ProductCategoryDto, SellerConfigDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function listBusinesses(): Promise<BusinessDto[]> {
  const res = await backendFetch('/products/businesses')
  if (!res.ok) throw new Error('Failed to fetch businesses')
  return res.json()
}

export async function listProductCategories(): Promise<ProductCategoryDto[]> {
  const res = await backendFetch('/products/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function listProducts(params?: {
  category?: string
  businessId?: string
  businessName?: string
  ownerId?: string
}): Promise<ProductDto[]> {
  const search = new URLSearchParams()
  if (params?.category) search.set('category', params.category)
  if (params?.businessId) search.set('businessId', params.businessId)
  if (params?.businessName) search.set('businessName', params.businessName)
  if (params?.ownerId) search.set('ownerId', params.ownerId)
  const qs = search.toString()
  const path = qs ? `/products?${qs}` : '/products'
  const res = await backendFetch(path)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function getProduct(id: string): Promise<ProductDto> {
  const res = await backendFetch(`/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function createProduct(data: {
  name: string
  category?: string | null
  price: number
  quantity?: number
  description?: string | null
  image?: string | null
  images?: string[] | null
}): Promise<ProductDto> {
  const res = await backendFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create product')
  }
  return res.json()
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    category?: string | null
    price?: number
    quantity?: number
    description?: string | null
    image?: string | null
    images?: string[] | null
  }
): Promise<ProductDto> {
  const res = await backendFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update product')
  }
  return res.json()
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await backendFetch(`/products/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to delete product')
  }
}

const MAX_PRODUCT_IMAGE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export async function uploadProductImage(formData: FormData): Promise<{ url: string }> {
  const file = formData.get('file')
  if (file instanceof File && file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 20 MB or smaller')
  }
  const res = await backendFetch('/products/upload-image', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Image upload failed')
  }
  return res.json()
}

export async function getBusinessRating(businessId: string): Promise<number> {
  const res = await backendFetch(`/reviews/business/${businessId}/rating`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load rating')
  }
  const value = await res.json()
  return typeof value === 'number' ? value : 0
}

export async function getMySellerConfig(): Promise<SellerConfigDto | null> {
  const res = await backendFetch('/sellers/me/config')
  if (res.status === 401 || res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load seller config')
  }
  return res.json()
}
