'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addOwner } from '@/lib/api'
import { TIER_LABELS, type TierId } from '@/lib/verification-tiers'
import { UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function AdminOwnersPage() {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [applyingForTier, setApplyingForTier] = useState<TierId | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user?.role !== 'super_admin') {
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
    setIsSubmitting(true)
    try {
      await addOwner({
        name,
        email,
        businessName,
        applyingForTier,
      })
      setSuccess(
        `Business onboarded (applying for ${TIER_LABELS[applyingForTier]}). The business admin will need to submit the required documents for that tier. A temporary password has been sent to the business email.`
      )
      setName('')
      setEmail('')
      setBusinessName('')
      setApplyingForTier('')
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to onboard business')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Onboard Business</h1>
          <p className="text-muted-foreground">
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
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Onboard Business</DialogTitle>
            <DialogDescription>
              Enter the business admin name, business email, and business name. Select the tier the business is applying for — this determines which documents the admin must submit for verification (Tier 1: ID/passport; Tier 2: business reg + location; Tier 3: KRA PIN + compliance). A temporary password will be sent to the business email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddOwner} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Business admin name</label>
              <Input
                placeholder="Full name of the business admin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10"
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
                className="mt-1 h-10"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Business Name</label>
              <Input
                placeholder="e.g. Acme Traders"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 h-10"
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
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
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
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Onboarding...
                  </>
                ) : (
                  'Onboard Business'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
