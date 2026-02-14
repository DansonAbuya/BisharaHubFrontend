'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addOwner } from '@/lib/actions/admin'
import { TIER_LABELS, type TierId } from '@/lib/verification-tiers'
import { UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function AdminOwnersPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [applyingForTier, setApplyingForTier] = useState<TierId | ''>('')
  const [payoutMethod, setPayoutMethod] = useState<'MPESA' | 'BANK_TRANSFER'>('MPESA')
  const [payoutDestination, setPayoutDestination] = useState('')
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

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!applyingForTier || !['tier1', 'tier2', 'tier3'].includes(applyingForTier)) {
      setError('Please select which tier the business is applying for.')
      return
    }
    if (!payoutDestination.trim()) {
      setError('Payout destination is required (e.g. M-Pesa number or bank account).')
      return
    }
    setIsSubmitting(true)
    try {
      await addOwner({
        name,
        email,
        businessName,
        applyingForTier,
        payoutMethod,
        payoutDestination: payoutDestination.trim(),
      })
      setSuccess(
        `Business onboarded (applying for ${TIER_LABELS[applyingForTier]}). The business admin will need to submit the required documents for that tier. A temporary password has been sent to the business email.`
      )
      setName('')
      setEmail('')
      setBusinessName('')
      setApplyingForTier('')
      setPayoutMethod('MPESA')
      setPayoutDestination('')
      setIsDialogOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to onboard business'
      setError(message)
      if (message.includes('Session expired') || message.includes('Not signed in') || message.includes('sign in again')) {
        logout()
        router.push('/admin/login')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground mb-2 sm:text-3xl">Onboard Business</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Platform admins onboard new businesses. Each business has an admin who can then add staff.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsDialogOpen(true)
            setError('')
            setSuccess('')
            setName('')
            setEmail('')
            setBusinessName('')
            setApplyingForTier('')
            setPayoutMethod('MPESA')
            setPayoutDestination('')
          }}
          className="w-full shrink-0 gap-2 sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <UserPlus className="w-4 h-4" />
          Onboard Business
        </Button>
      </div>

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">How it works</CardTitle>
          <CardDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Platform admin onboard businesses (creates business accounts with a business admin)</li>
              <li>Business admin logs in and manages the business (products, orders, etc.)</li>
              <li>Business admin adds staff from the Staff Management page</li>
              <li>Customers sign up themselves from the public sign-up page</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col p-4 shadow-lg sm:max-h-[85vh] sm:max-w-md sm:p-6 md:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 pr-8 sm:pr-10">
            <DialogTitle className="text-base text-foreground sm:text-lg">Onboard Business</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter the business admin name, email, business name, and tier. Add the seller&apos;s payout details — these are used to automatically transfer their earnings when orders are delivered. A temporary password will be sent to the business email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddOwner} className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 -mx-1 px-1 sm:py-0 sm:mx-0 sm:px-0">
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="shrink-0">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground">Business admin name</label>
                  <Input
                    placeholder="Full name of the business admin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 h-10 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Business email</label>
                  <Input
                    type="email"
                    placeholder="contact@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-10 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Business Name</label>
                  <Input
                    placeholder="e.g. Acme Traders"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 h-10 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Applying for tier <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={applyingForTier}
                    onChange={(e) => setApplyingForTier((e.target.value || '') as TierId | '')}
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                    aria-required="true"
                  >
                    <option value="">— Select tier —</option>
                    <option value="tier1">{TIER_LABELS.tier1}</option>
                    <option value="tier2">{TIER_LABELS.tier2}</option>
                    <option value="tier3">{TIER_LABELS.tier3}</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tier 1: ID/passport. Tier 2: business reg + location. Tier 3: KRA PIN + compliance.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Payout method <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as 'MPESA' | 'BANK_TRANSFER')}
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                    aria-required="true"
                  >
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earnings are sent here automatically when orders are delivered.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Payout destination <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder={payoutMethod === 'MPESA' ? 'e.g. 254712345678 or 0712345678' : 'Bank name and account number'}
                    value={payoutDestination}
                    onChange={(e) => setPayoutDestination(e.target.value)}
                    className="mt-1.5 h-10 w-full"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex shrink-0 gap-2 border-t border-border pt-4 sm:mt-4 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 sm:flex-initial"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-0 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground sm:flex-initial"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">Onboarding...</span>
                  </>
                ) : (
                  <span className="truncate">Onboard Business</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
