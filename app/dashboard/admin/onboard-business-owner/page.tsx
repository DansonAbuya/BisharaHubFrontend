'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { addBusinessOwner } from '@/lib/actions/admin'
import { TIER_LABELS, type TierId } from '@/lib/verification-tiers'
import { UserPlus, Briefcase, Package, Wrench } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function OnboardBusinessOwnerPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [sellsProducts, setSellsProducts] = useState(false)
  const [offersServices, setOffersServices] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!sellsProducts && !offersServices) {
      setError('Please select at least one option: sell products or offer services.')
      return
    }

    if (sellsProducts) {
      if (!applyingForTier || !['tier1', 'tier2', 'tier3'].includes(applyingForTier)) {
        setError('Please select which tier the business is applying for.')
        return
      }
      if (!payoutDestination.trim()) {
        setError('Payout destination is required for product sellers (e.g. M-Pesa number or bank account).')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await addBusinessOwner({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        businessName: businessName.trim(),
        sellsProducts,
        offersServices,
        applyingForTier: sellsProducts ? applyingForTier : undefined,
        payoutMethod: sellsProducts ? payoutMethod : undefined,
        payoutDestination: sellsProducts ? payoutDestination.trim() : undefined,
      })

      let successMsg = 'Business owner onboarded successfully. A temporary password has been sent to their email.\n\n'
      if (sellsProducts && offersServices) {
        successMsg += 'They can sell products AND offer services. After logging in:\n' +
          '• For products: Go to Verification → Sell products, upload documents for their tier, then add products.\n' +
          '• For services: Go to Verification → Offer services, choose category/delivery type, upload qualification documents, then add services.\n' +
          'Review and approve each verification type separately.'
      } else if (sellsProducts) {
        successMsg += 'They will sell products. After logging in, they go to Verification → Sell products, upload documents for their tier. Once verified, they can add products.'
      } else {
        successMsg += 'They will offer services. After logging in, they go to Verification → Offer services, choose category/delivery type, upload qualification documents. Once verified, they can add services.'
      }
      setSuccess(successMsg)

      setName('')
      setEmail('')
      setBusinessName('')
      setSellsProducts(false)
      setOffersServices(false)
      setApplyingForTier('')
      setPayoutMethod('MPESA')
      setPayoutDestination('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to onboard business owner'
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
          <Briefcase className="w-8 h-8 text-primary" />
          Onboard Business Owner
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create an account for someone who wants to sell products, offer services, or both.
          They receive a temporary password by email and complete verification for their selected business type(s).
        </p>
      </div>

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription className="whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Add business owner</CardTitle>
          <CardDescription>
            Enter their details and select what they want to do on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="text-sm font-medium text-foreground">Business name</label>
              <Input
                placeholder="e.g. Acme Traders, ABC Consulting"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1.5 h-10 w-full"
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-foreground">What will they do on the platform?</label>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="sellsProducts"
                  checked={sellsProducts}
                  onCheckedChange={(checked) => setSellsProducts(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="sellsProducts" className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer">
                    <Package className="w-4 h-4 text-primary" />
                    Sell products
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    List products in a shop for customers to buy
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="offersServices"
                  checked={offersServices}
                  onCheckedChange={(checked) => setOffersServices(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="offersServices" className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer">
                    <Wrench className="w-4 h-4 text-primary" />
                    Offer services
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Offer expertise, skills, or talents for payment (online or in-person)
                  </p>
                </div>
              </div>
            </div>

            {sellsProducts && (
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-sm font-medium text-foreground pt-2">Product seller details</p>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Applying for tier <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={applyingForTier}
                    onChange={(e) => setApplyingForTier((e.target.value || '') as TierId | '')}
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required={sellsProducts}
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
                    required={sellsProducts}
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
                    required={sellsProducts}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Onboarding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Onboard Business Owner
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
              <li>Business owner receives email with temporary password.</li>
              <li>They log in and go to <strong>Verification</strong> in their dashboard.</li>
              <li>
                <strong>If selling products:</strong> Complete <em>Sell products</em> verification (upload tier documents). 
                Once approved, add products in Dashboard → Products.
              </li>
              <li>
                <strong>If offering services:</strong> Complete <em>Offer services</em> verification (category, delivery type, qualification docs). 
                Add services in Dashboard → Services. Once approved, services are listed.
              </li>
              <li>You review and approve each verification type in <strong>Verify Business</strong> and <strong>Verify Service Providers</strong>.</li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
