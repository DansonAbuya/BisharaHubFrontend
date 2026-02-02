'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, UserPlus } from 'lucide-react'

export function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Platform Admin</h1>
        <p className="text-muted-foreground">
          Manage the BiasharaHub platform and onboard business owners
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Add Business Owners
            </CardTitle>
            <CardDescription>
              Onboard new business owners to the platform. Owners can then add their staff and manage their business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/owners">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <UserPlus className="w-4 h-4" />
                Add Owner
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
