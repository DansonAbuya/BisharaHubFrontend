'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileCheck, Settings, Shield, UserPlus, Users, Wrench } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'

export function AdminDashboard() {
  const { user } = useAuth()

  if (user?.role === 'assistant_admin') {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title={`Welcome, ${user?.name ?? 'there'}`}
          description="You are logged in as an assistant administrator. You can verify business owners and assign seller tiers. 2FA is always on for your account."
        />

        <PageSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Onboard Service Provider
                </CardTitle>
                <CardDescription>
                  Create service provider accounts. They receive a verification code by email, then add service details and upload documents for you to verify.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/admin/onboard-service-provider">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Onboard Service Provider
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Verify Business
                </CardTitle>
                <CardDescription>
                  Approve or reject pending businesses and assign seller tier (Informal, Registered SME, Corporate).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/admin/pending-verification">
                  <Button variant="outline" className="gap-2">
                    Open Verify Business
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Verify Service Providers
                </CardTitle>
                <CardDescription>
                  Approve or reject service providers who submitted documents. Once approved, their services are listed on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/admin/pending-service-providers">
                  <Button variant="outline" className="gap-2">
                    Open Verify Service Providers
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
                  <Button variant="outline" className="gap-2">
                    Open Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </PageSection>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={`Welcome, ${user?.name ?? 'there'}`}
        description="Manage the BiasharaHub platform and onboard businesses."
      />

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Onboard Business
              </CardTitle>
              <CardDescription>
                Onboard new businesses (business admin name, business email, business name, tier). A temporary password is sent to the business email; the admin starts as pending verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/admin/owners">
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <UserPlus className="w-4 h-4" />
                  Onboard Business
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Onboard Service Provider
              </CardTitle>
              <CardDescription>
                Create service provider accounts. They receive a verification code by email; they log in, add service details and upload documents. You then verify and approve so their services are listed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/admin/onboard-service-provider">
                <Button variant="outline" className="gap-2">
                  Onboard Service Provider
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Verify Business
              </CardTitle>
              <CardDescription>
                Approve or reject pending businesses and assign seller tier (Informal, Registered SME, Corporate). Verified businesses’ shops appear on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/admin/pending-verification">
                <Button variant="outline" className="gap-2">
                  Open Verify Business
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Verify Service Providers
              </CardTitle>
              <CardDescription>
                Approve or reject service providers who submitted documents. Once approved, their services are listed on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/admin/pending-service-providers">
                <Button variant="outline" className="gap-2">
                  Open Verify Service Providers
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
      </PageSection>
    </div>
  )
}

