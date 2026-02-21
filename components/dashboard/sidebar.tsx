'use client'

import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Settings,
  Store,
  Truck,
  Shield,
  FileCheck,
  Receipt,
  Wallet,
  Banknote,
  Wrench,
  Briefcase,
  Calendar,
  CalendarCheck,
  Clock,
  BookOpen,
} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if user is set up for products, services, or both
  // NOTE: verificationStatus defaults to 'pending' for all owners, so only count 'verified' or explicit tier setup
  const isOwner = user?.role === 'owner'
  const isProductSeller = !!(user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified')
  const isServiceProvider = !!(user?.serviceProviderStatus)
  const isVerifiedProductSeller = user?.verificationStatus === 'verified'
  const isVerifiedServiceProvider = user?.serviceProviderStatus === 'verified'
  
  // User is unverified if they are an owner but not verified
  const isUnverifiedOwner = isOwner && (
    (isServiceProvider && !isVerifiedServiceProvider && !isProductSeller) ||
    (isProductSeller && !isVerifiedProductSeller && !isServiceProvider) ||
    (isServiceProvider && isProductSeller && !isVerifiedServiceProvider && !isVerifiedProductSeller) ||
    (!isServiceProvider && !isProductSeller)
  )

  // Show products/services based on what's set up (only for verified owners)
  const showProducts = !isUnverifiedOwner && (isProductSeller || (!isProductSeller && !isServiceProvider))
  const showServices = !isUnverifiedOwner && (isServiceProvider || (!isProductSeller && !isServiceProvider))

  // Build owner menu dynamically - unverified owners only see verification
  const ownerMenu = isUnverifiedOwner
    ? [
        { label: 'Verification', icon: FileCheck, href: '/dashboard/verification' },
      ]
    : [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
        // Product seller items
        ...(showProducts ? [
          { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders' },
          { label: 'Products', icon: Package, href: '/dashboard/products' },
          { label: 'Shipments', icon: Truck, href: '/dashboard/shipments' },
        ] : []),
        // Service provider items
        ...(showServices ? [
          { label: 'My Services', icon: Wrench, href: '/dashboard/services' },
          { label: 'Appointments', icon: CalendarCheck, href: '/dashboard/appointments' },
          { label: 'Schedule', icon: Calendar, href: '/dashboard/schedule' },
          { label: 'Availability', icon: Clock, href: '/dashboard/availability' },
        ] : []),
        { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
        { label: 'Expenses', icon: Receipt, href: '/dashboard/expenses' },
        { label: 'Accounting', icon: Wallet, href: '/dashboard/accounting' },
        { label: 'Reconciliation', icon: Banknote, href: '/dashboard/reconciliation' },
        { label: 'Staff', icon: Users, href: '/dashboard/staff' },
        // Couriers only for product sellers
        ...(showProducts ? [
          { label: 'Couriers', icon: Truck, href: '/dashboard/couriers' },
        ] : []),
        { label: 'Verification', icon: FileCheck, href: '/dashboard/verification' },
        { label: 'Browse store', icon: Store, href: '/dashboard/storefront' },
        { label: 'Wishlist (customer)', icon: Package, href: '/dashboard/wishlist' },
        { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
      ]

  const menuItems = {
    courier: [
      { label: 'My Deliveries', icon: Truck, href: '/dashboard/courier' },
      { label: 'Profile', icon: Users, href: '/dashboard/profile' },
    ],
    owner: ownerMenu,
    staff: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Products', icon: Package, href: '/dashboard/products' },
      { label: 'Services', icon: Wrench, href: '/dashboard/services' },
      { label: 'Shipments', icon: Truck, href: '/dashboard/shipments' },
      { label: 'Expenses', icon: Receipt, href: '/dashboard/expenses' },
      { label: 'Accounting', icon: Wallet, href: '/dashboard/accounting' },
      { label: 'Reconciliation', icon: Banknote, href: '/dashboard/reconciliation' },
      { label: 'Browse store', icon: Store, href: '/dashboard/storefront' },
      { label: 'Wishlist (customer)', icon: Package, href: '/dashboard/wishlist' },
    ],
    customer: [
      { label: 'Browse', icon: Store, href: '/dashboard' },
      { label: 'My Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Services', icon: Wrench, href: '/dashboard/services' },
      { label: 'Wishlist', icon: Package, href: '/dashboard/wishlist' },
      { label: 'Profile', icon: Users, href: '/dashboard/profile' },
    ],
    super_admin: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Products', icon: Package, href: '/dashboard/products' },
      { label: 'Services', icon: Wrench, href: '/dashboard/services' },
      { label: 'Shipments', icon: Truck, href: '/dashboard/shipments' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
      { label: 'Expenses', icon: Receipt, href: '/dashboard/expenses' },
      { label: 'Accounting', icon: Wallet, href: '/dashboard/accounting' },
      { label: 'Reconciliation', icon: Banknote, href: '/dashboard/reconciliation' },
      { label: 'Staff', icon: Users, href: '/dashboard/staff' },
      { label: 'Onboard Business Owner', icon: Briefcase, href: '/dashboard/admin/onboard-business-owner' },
      { label: 'Onboard Product Seller', icon: Shield, href: '/dashboard/admin/owners' },
      { label: 'Onboard Service Provider', icon: Wrench, href: '/dashboard/admin/onboard-service-provider' },
      { label: 'Verify Business', icon: Shield, href: '/dashboard/admin/pending-verification' },
      { label: 'Verify Service Providers', icon: Wrench, href: '/dashboard/admin/pending-service-providers' },
      { label: 'Disputes', icon: FileCheck, href: '/dashboard/admin/disputes' },
      { label: 'Assistant Admins', icon: Users, href: '/dashboard/admin/assistant-admins' },
      { label: 'Seller Pricing & Branding', icon: Settings, href: '/dashboard/admin/seller-config' },
      { label: 'Courier Services', icon: Truck, href: '/dashboard/admin/courier-services' },
      { label: 'API Documentation', icon: BookOpen, href: '/dashboard/admin/api-docs' },
      { label: 'Browse store', icon: Store, href: '/dashboard/storefront' },
      { label: 'Wishlist', icon: Package, href: '/dashboard/wishlist' },
      { label: 'Profile', icon: Users, href: '/dashboard/profile' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
    assistant_admin: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Onboard Business Owner', icon: Briefcase, href: '/dashboard/admin/onboard-business-owner' },
      { label: 'Onboard Product Seller', icon: Shield, href: '/dashboard/admin/owners' },
      { label: 'Onboard Service Provider', icon: Wrench, href: '/dashboard/admin/onboard-service-provider' },
      { label: 'Verify Business', icon: Shield, href: '/dashboard/admin/pending-verification' },
      { label: 'Verify Service Providers', icon: Wrench, href: '/dashboard/admin/pending-service-providers' },
      { label: 'Disputes', icon: FileCheck, href: '/dashboard/admin/disputes' },
      { label: 'Courier Services', icon: Truck, href: '/dashboard/admin/courier-services' },
      { label: 'API Documentation', icon: BookOpen, href: '/dashboard/admin/api-docs' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
  }

  const items = user ? (menuItems[user.role as keyof typeof menuItems] ?? menuItems.customer) : []

  const operationsItems = items.filter((item) =>
    ['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/services', '/dashboard/shipments', '/dashboard/courier', '/dashboard/appointments', '/dashboard/schedule', '/dashboard/availability'].includes(item.href),
  )
  const analyticsItems = items.filter((item) =>
    ['/dashboard/analytics', '/dashboard/expenses', '/dashboard/accounting', '/dashboard/reconciliation', '/dashboard/staff', '/dashboard/couriers'].includes(item.href),
  )
  const platformItems = items.filter((item) =>
    item.href.startsWith('/dashboard/admin') || ['/dashboard/verification'].includes(item.href),
  )
  const storefrontItems = items.filter((item) =>
    ['/dashboard/storefront', '/dashboard/wishlist'].includes(item.href),
  )
  const accountItems = items.filter((item) =>
    ['/dashboard/profile', '/dashboard/settings'].includes(item.href),
  )

  const renderSection = (label: string, sectionItems: typeof items) => {
    if (sectionItems.length === 0) return null
    return (
      <div className="space-y-1">
        <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground/70">
          {label}
        </p>
        <div className="space-y-1">
          {sectionItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-3 px-4 min-h-[40px] rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : 'text-primary-foreground/90 hover:bg-primary/80 active:bg-primary/70',
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <aside className="w-64 h-full bg-primary text-primary-foreground border-r border-sidebar-border shadow-sm flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-primary/30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo-favicon.png"
            alt="BiasharaHub"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          <span className="font-bold text-lg">BiasharaHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-4 overflow-y-auto">
        {user?.role === 'courier' ? (
          renderSection('Deliveries', operationsItems)
        ) : (
          renderSection('Operations', operationsItems)
        )}
        {user?.role !== 'courier' && renderSection('Analytics & Team', analyticsItems)}
        {user?.role !== 'courier' && renderSection('Platform', platformItems)}
        {user?.role !== 'courier' && renderSection('Storefront', storefrontItems)}
        {renderSection('Account', accountItems)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/30 space-y-3 safe-area-pb">
        <div className="px-2">
          <p className="text-xs text-primary-foreground/70 uppercase tracking-wider font-semibold">
            Logged in as
          </p>
          <p className="text-sm font-medium mt-1 truncate">{user?.name}</p>
          <p className="text-xs text-primary-foreground/70 capitalize truncate">{user?.role} Account</p>
        </div>
      </div>
    </aside>
  )
}
