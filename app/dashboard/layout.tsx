'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavBar } from '@/components/dashboard/top-nav-bar'
import { Spinner } from '@/components/ui/spinner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const PATH_LABELS: Record<string, string> = {
  orders: 'Orders',
  products: 'Products',
  services: 'Services',
  shipments: 'Shipments',
  courier: 'My Deliveries',
  couriers: 'Couriers',
  expenses: 'Expenses',
  accounting: 'Accounting',
  reconciliation: 'Reconciliation',
  analytics: 'Analytics',
  staff: 'Staff',
  verification: 'Verification',
  storefront: 'Store',
  wishlist: 'Wishlist',
  profile: 'Profile',
  settings: 'Settings',
  admin: 'Admin',
  owners: 'Onboard Product Seller',
  'onboard-business-owner': 'Onboard Business Owner',
  'onboard-service-provider': 'Onboard Service Provider',
  'pending-verification': 'Verify Business',
  'pending-service-providers': 'Verify Service Providers',
  'assistant-admins': 'Assistant Admins',
  disputes: 'Disputes',
}

function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean)
  if (segments.length === 0) return null
  return (
    <Breadcrumb className="mb-2 sm:mb-3">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, i) => {
          const label = PATH_LABELS[seg] || seg.replace(/-/g, ' ')
          const isLast = i === segments.length - 1
          const href = '/dashboard/' + segments.slice(0, i + 1).join('/')
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="capitalize">{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isInitialized } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if user is an unverified owner (service provider or product seller)
  // NOTE: verificationStatus defaults to 'pending' for all owners, so only count 'verified' or explicit tier setup
  const isOwner = user?.role === 'owner'
  const isProductSeller = !!(user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified')
  const isServiceProvider = !!(user?.serviceProviderStatus)
  const isVerifiedProductSeller = user?.verificationStatus === 'verified'
  const isVerifiedServiceProvider = user?.serviceProviderStatus === 'verified'
  
  // User is unverified if they are an owner but not verified for either products or services
  const isUnverifiedOwner = isOwner && (
    (isServiceProvider && !isVerifiedServiceProvider && !isProductSeller) ||
    (isProductSeller && !isVerifiedProductSeller && !isServiceProvider) ||
    (isServiceProvider && isProductSeller && !isVerifiedServiceProvider && !isVerifiedProductSeller) ||
    (!isServiceProvider && !isProductSeller) // New owner with nothing set up yet
  )

  const isOnVerificationPage = pathname === '/dashboard/verification'

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/')
    }
  }, [user, isInitialized, router])

  // Redirect unverified owners to verification page (except if already there)
  useEffect(() => {
    if (isInitialized && user && isUnverifiedOwner && !isOnVerificationPage) {
      router.push('/dashboard/verification')
    }
  }, [isInitialized, user, isUnverifiedOwner, isOnVerificationPage, router])

  if (!isInitialized || !user) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  // For unverified owners, show a minimal layout with just the verification page
  if (isUnverifiedOwner && isOnVerificationPage) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollable-touch">
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    )
  }

  // If unverified and not on verification page, show loading while redirecting
  if (isUnverifiedOwner) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed lg:static inset-y-0 left-0 w-64 h-full lg:h-auto z-50 transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <TopNavBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollable-touch">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <DashboardBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
