'use client'

import React, { useState } from "react"
import { useEffect } from 'react'
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
  shipments: 'Shipments',
  analytics: 'Analytics',
  staff: 'Staff',
  verification: 'Verification',
  storefront: 'Store',
  wishlist: 'Wishlist',
  profile: 'Profile',
  settings: 'Settings',
  admin: 'Admin',
  owners: 'Onboard Business',
  'pending-verification': 'Verify Business',
  'assistant-admins': 'Assistant Admins',
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login')
    }
  }, [user, isInitialized, router])

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-[100dvh] bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className={`fixed lg:static inset-y-0 left-0 w-64 h-full lg:h-auto z-50 transform transition-transform duration-200 ease-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <TopNavBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto min-h-0">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <DashboardBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
