'use client'

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
} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = {
    owner: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Products', icon: Package, href: '/dashboard/products' },
      { label: 'Shipments', icon: Truck, href: '/dashboard/shipments' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
      { label: 'Staff', icon: Users, href: '/dashboard/staff' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
    staff: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Products', icon: Package, href: '/dashboard/products' },
      { label: 'Shipments', icon: Truck, href: '/dashboard/shipments' },
    ],
    customer: [
      { label: 'Browse', icon: Store, href: '/dashboard' },
      { label: 'My Orders', icon: ShoppingBag, href: '/dashboard/orders' },
      { label: 'Wishlist', icon: Package, href: '/dashboard/wishlist' },
      { label: 'Profile', icon: Users, href: '/dashboard/profile' },
    ],
    super_admin: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Add Owners', icon: Shield, href: '/dashboard/admin/owners' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
  }

  const items = user ? (menuItems[user.role as keyof typeof menuItems] ?? menuItems.customer) : []

  return (
    <aside className="w-64 h-full bg-primary text-primary-foreground border-r border-sidebar-border shadow-sm flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary/30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-sm">BH</span>
          </div>
          <span className="font-bold text-lg">BiasharaHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-foreground text-primary'
                  : 'text-primary-foreground hover:bg-primary/80',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/30 space-y-3">
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
