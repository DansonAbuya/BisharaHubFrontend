// Mock data for BiasharaHub platform

export interface Product {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  image: string
  description: string
  businessId: string
}

export interface Order {
  id: string
  orderId: string
  customerId: string
  customerName: string
  customerEmail?: string
  businessId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed'
  paymentMethod?: string
  createdAt: Date
  updatedAt: Date
  shippingAddress?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface Shipment {
  id: string
  orderId: string
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered'
  carrier?: string
  trackingNumber?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
}

export interface Inventory {
  productId: string
  quantity: number
  reorderLevel: number
  lastRestocked: Date
}

export interface Analytics {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  averageOrderValue: number
  topProducts: Product[]
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

// Mock Products
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Hand-woven Baskets',
    category: 'Craft',
    price: 35000,
    quantity: 45,
    image: '/products/basket.jpg',
    description: 'Traditional hand-woven baskets made with natural materials',
    businessId: 'biz-1',
  },
  {
    id: 'prod-2',
    name: 'Shea Butter (200g)',
    category: 'Beauty',
    price: 12500,
    quantity: 120,
    image: '/products/shea.jpg',
    description: 'Pure organic shea butter for skin care',
    businessId: 'biz-1',
  },
  {
    id: 'prod-3',
    name: 'Kente Cloth Scarf',
    category: 'Textiles',
    price: 28000,
    quantity: 25,
    image: '/products/kente.jpg',
    description: 'Authentic Kente cloth scarves',
    businessId: 'biz-1',
  },
  {
    id: 'prod-4',
    name: 'Beaded Necklaces',
    category: 'Jewelry',
    price: 18000,
    quantity: 60,
    image: '/products/necklace.jpg',
    description: 'Colorful handmade beaded necklaces',
    businessId: 'biz-1',
  },
  {
    id: 'prod-5',
    name: 'Wooden Serving Bowls',
    category: 'Homeware',
    price: 22000,
    quantity: 35,
    image: '/products/bowl.jpg',
    description: 'Hand-carved wooden serving bowls',
    businessId: 'biz-1',
  },
]

// Mock Orders
export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderId: 'ORD-2026-001',
    customerId: 'cust-1',
    customerName: 'Jane Mwangi',
    customerEmail: 'jane@example.com',
    businessId: 'biz-1',
    items: [
      { productId: 'prod-1', productName: 'Hand-woven Baskets', quantity: 2, price: 35000, subtotal: 70000 },
      { productId: 'prod-2', productName: 'Shea Butter (200g)', quantity: 1, price: 12500, subtotal: 12500 },
    ],
    total: 82500,
    status: 'processing',
    paymentStatus: 'completed',
    paymentMethod: 'M-Pesa',
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-01-30'),
    shippingAddress: 'Nairobi, Kenya',
  },
  {
    id: 'order-2',
    orderId: 'ORD-2026-002',
    customerId: 'cust-2',
    customerName: 'Ahmed Hassan',
    customerEmail: 'ahmed@example.com',
    businessId: 'biz-1',
    items: [
      { productId: 'prod-4', productName: 'Beaded Necklaces', quantity: 3, price: 18000, subtotal: 54000 },
    ],
    total: 54000,
    status: 'shipped',
    paymentStatus: 'completed',
    paymentMethod: 'M-Pesa',
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-29'),
    shippingAddress: 'Dar es Salaam, Tanzania',
  },
  {
    id: 'order-3',
    orderId: 'ORD-2026-003',
    customerId: 'cust-3',
    customerName: 'Sarah Okonkwo',
    customerEmail: 'sarah@example.com',
    businessId: 'biz-1',
    items: [
      { productId: 'prod-3', productName: 'Kente Cloth Scarf', quantity: 1, price: 28000, subtotal: 28000 },
      { productId: 'prod-5', productName: 'Wooden Serving Bowls', quantity: 2, price: 22000, subtotal: 44000 },
    ],
    total: 72000,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    shippingAddress: 'Lagos, Nigeria',
  },
  {
    id: 'order-4',
    orderId: 'ORD-2026-004',
    customerId: 'cust-4',
    customerName: 'Amina Patel',
    customerEmail: 'amina@example.com',
    businessId: 'biz-1',
    items: [
      { productId: 'prod-1', productName: 'Hand-woven Baskets', quantity: 1, price: 35000, subtotal: 35000 },
    ],
    total: 35000,
    status: 'delivered',
    paymentStatus: 'completed',
    paymentMethod: 'Card',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-27'),
    shippingAddress: 'Kampala, Uganda',
  },
]

// Mock Shipments
export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'ship-1',
    orderId: 'order-1',
    status: 'in_transit',
    carrier: 'Express Logistics',
    trackingNumber: 'EXP-2026-12345',
    estimatedDelivery: new Date('2026-02-05'),
  },
  {
    id: 'ship-2',
    orderId: 'order-2',
    status: 'in_transit',
    carrier: 'QuickShip',
    trackingNumber: 'QS-2026-67890',
    estimatedDelivery: new Date('2026-02-04'),
  },
  {
    id: 'ship-3',
    orderId: 'order-4',
    status: 'delivered',
    carrier: 'FastShip',
    trackingNumber: 'FS-2026-11111',
    actualDelivery: new Date('2026-01-27'),
  },
]

// Mock Analytics
export const MOCK_ANALYTICS: Analytics = {
  totalOrders: 156,
  totalRevenue: 3850000,
  pendingOrders: 12,
  averageOrderValue: 24679,
  topProducts: MOCK_PRODUCTS.slice(0, 3),
  monthlyRevenue: [
    { month: 'December', revenue: 850000 },
    { month: 'January', revenue: 1250000 },
    { month: 'February', revenue: 1750000 },
  ],
}

// Inventory
export const MOCK_INVENTORY: Record<string, Inventory> = {
  'prod-1': { productId: 'prod-1', quantity: 45, reorderLevel: 20, lastRestocked: new Date('2026-01-15') },
  'prod-2': { productId: 'prod-2', quantity: 120, reorderLevel: 50, lastRestocked: new Date('2026-01-20') },
  'prod-3': { productId: 'prod-3', quantity: 25, reorderLevel: 15, lastRestocked: new Date('2026-01-10') },
  'prod-4': { productId: 'prod-4', quantity: 60, reorderLevel: 30, lastRestocked: new Date('2026-01-25') },
  'prod-5': { productId: 'prod-5', quantity: 35, reorderLevel: 25, lastRestocked: new Date('2026-01-22') },
}
