'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { addServiceProvider } from '@/lib/actions/admin'
import { UserPlus, Wrench } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function OnboardServiceProviderPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  if (!isPlatformAdmin) {
    return (
      <div>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">
              This page is only available to platform administrators.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-4">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await addServiceProvider({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        businessName: businessName.trim(),
      })
      setSuccess(
        'Service provider onboarded. A verification code (temporary password) has been sent to their email. ' +
        'They must log in, add their service category and details, upload verification and qualification documents in Verification → Offer services, ' +
        'and add service offerings in Dashboard → Services. Then use Verify Service Providers to approve so their services are listed on the platform.'
      )
      setName('')
      setEmail('')
      setBusinessName('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to onboard service provider'
      setError(message)
      if (message.includes('Session expired') || message.includes('sign in again')) {
        logout()
        router.push('/')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2 sm:text-3xl flex items-center gap-2">
          <Wrench className="w-8 h-8 text-primary" />
          Onboard Service Provider
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create a service provider account. They receive a verification code (temporary password) by email to log in.
          After logging in they add service category, service details, and upload verification and qualification documents.
          You then verify and approve them in Verify Service Providers so their services are listed.
        </p>
      </div>

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Add service provider</CardTitle>
          <CardDescription>
            Enter name, email, and business or service name. A verification code will be sent to their email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 h-10 w-full"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-10 w-full"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Business or service name</label>
              <Input
                placeholder="e.g. ABC Consulting, Mobile Repairs Co"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1.5 h-10 w-full"
                required
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Onboarding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Onboard Service Provider
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30 max-w-xl">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Flow after onboarding</CardTitle>
          <CardDescription>
            <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
              <li>Service provider receives email with verification code (temporary password).</li>
              <li>They log in and go to <strong>Verification → Offer services</strong>: choose service category, delivery type (online/in-person/both), upload verification and qualification/expertise documents.</li>
              <li>They add their service offerings in <strong>Dashboard → Services</strong> (name, price, description).</li>
              <li>You review and approve in <strong>Verify Service Providers</strong>. Once approved, their services are listed on the platform.</li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
