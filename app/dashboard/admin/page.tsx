'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

/**
 * Default page for /dashboard/admin – redirect to main dashboard.
 * Prevents 404 when visiting /dashboard/admin without a subpath.
 */
export default function AdminIndexPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const role = user?.role
    if (role === 'super_admin' || role === 'assistant_admin') {
      router.replace('/dashboard')
    } else {
      router.replace('/dashboard')
    }
  }, [router, user?.role])

  return (
    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
      Redirecting...
    </div>
  )
}
