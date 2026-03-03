'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { OwnerDashboard } from '@/components/dashboard/owner-dashboard'
import { StaffDashboard } from '@/components/dashboard/staff-dashboard'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Supplier default screen is the list of dispatches.
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'supplier') {
      router.replace('/dashboard/supplier-dispatches')
    }
  }, [user?.role, router])

  if (!user) return null

  const role = user.role?.toLowerCase()
  if (role === 'supplier') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  switch (user.role) {
    case 'owner':
      return <OwnerDashboard />
    case 'staff':
      return <StaffDashboard />
    case 'customer':
      return <CustomerDashboard />
    case 'super_admin':
      return <AdminDashboard />
    case 'assistant_admin':
      return <AdminDashboard />
    default:
      return null
  }
}
