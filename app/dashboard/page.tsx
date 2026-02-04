'use client'

import { useAuth } from '@/lib/auth-context'
import { OwnerDashboard } from '@/components/dashboard/owner-dashboard'
import { StaffDashboard } from '@/components/dashboard/staff-dashboard'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

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
