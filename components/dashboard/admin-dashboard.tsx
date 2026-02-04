'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, UserPlus, Users, Settings } from 'lucide-react'

export function AdminDashboard() {
  const { user } = useAuth()

  if (user?.role === 'assistant_admin') {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user?.name ?? 'there'}</h1>
          <p className="text-muted-foreground">
            You are logged in as an assistant administrator. 2FA is always on for your account.
          </p>
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Change your password and manage your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                Open Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user?.name ?? 'there'}</h1>
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
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assistant Admins
            </CardTitle>
            <CardDescription>
              Add assistant administrators. They receive a temporary password by email; 2FA is always on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/assistant-admins">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <UserPlus className="w-4 h-4" />
                Add Assistant Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
