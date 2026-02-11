'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  listSellerConfigs,
  setSellerPricingPlan,
  setSellerBranding,
  type SellerConfigDto,
} from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Paintbrush, Tag } from 'lucide-react'

export default function AdminSellerConfigPage() {
  const { user } = useAuth()
  const [sellers, setSellers] = useState<SellerConfigDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  useEffect(() => {
    if (!isPlatformAdmin) {
      setLoading(false)
      return
    }
    listSellerConfigs()
      .then(setSellers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sellers'))
      .finally(() => setLoading(false))
  }, [isPlatformAdmin])

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

  const handlePricingChange = async (seller: SellerConfigDto, pricingPlan: string) => {
    setSavingId(seller.userId)
    setError('')
    try {
      const updated = await setSellerPricingPlan(seller.userId, pricingPlan)
      setSellers((prev) => prev.map((s) => (s.userId === updated.userId ? updated : s)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing plan')
    } finally {
      setSavingId(null)
    }
  }

  const handleBrandingToggle = async (seller: SellerConfigDto, enabled: boolean) => {
    setSavingId(seller.userId)
    setError('')
    try {
      const updated = await setSellerBranding(seller.userId, {
        brandingEnabled: enabled,
        brandingName: enabled ? seller.brandingName ?? seller.businessName ?? seller.name ?? '' : null,
      })
      setSellers((prev) => prev.map((s) => (s.userId === updated.userId ? updated : s)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding')
    } finally {
      setSavingId(null)
    }
  }

  const handleBrandingNameChange = (userId: string, name: string) => {
    setSellers((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, brandingName: name } : s)),
    )
  }

  const handleBrandingSave = async (seller: SellerConfigDto) => {
    setSavingId(seller.userId)
    setError('')
    try {
      const updated = await setSellerBranding(seller.userId, {
        brandingEnabled: !!seller.brandingEnabled,
        brandingName: seller.brandingName ?? '',
        brandingLogoUrl: seller.brandingLogoUrl ?? null,
        brandingPrimaryColor: seller.brandingPrimaryColor ?? null,
        brandingSecondaryColor: seller.brandingSecondaryColor ?? null,
      })
      setSellers((prev) => prev.map((s) => (s.userId === updated.userId ? updated : s)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Seller Pricing & Branding</h1>
          <p className="text-muted-foreground text-sm">
            Assign pricing models and white-label branding to verified sellers. By default, all
            sellers use the BiasharaHub brand.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Sellers
          </CardTitle>
          <CardDescription>
            Pricing plans are marketing/commercial models tailored to Kenyan SMEs:
            Starter (KES 0), Growth (KES 1,500), Pro (KES 5,000). White label branding (custom
            store) is available only on the Pro plan; by default sellers use the BiasharaHub brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="w-6 h-6 mr-2" />
              <span className="text-sm text-muted-foreground">Loading sellers...</span>
            </div>
          ) : sellers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No sellers found. Onboard a business first.
            </p>
          ) : (
            <div className="space-y-4">
              {sellers.map((seller) => (
                <div
                  key={seller.userId}
                  className="p-4 border border-border rounded-lg space-y-3 bg-card/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {seller.businessName || seller.name || seller.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{seller.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        {seller.sellerTier && (
                          <Badge variant="outline">Tier: {seller.sellerTier}</Badge>
                        )}
                        {seller.verificationStatus && (
                          <Badge
                            variant="outline"
                            className={
                              seller.verificationStatus === 'verified'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-amber-500 text-amber-600'
                            }
                          >
                            {seller.verificationStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/dashboard/admin/seller-config/${seller.userId}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Configure setup
                        </Button>
                      </Link>
                      <Badge variant="outline">
                        Pricing:{' '}
                        {seller.pricingPlan === 'starter'
                          ? 'Starter – KES 0 / month'
                          : seller.pricingPlan === 'growth'
                          ? 'Growth – KES 1,500 / month'
                          : seller.pricingPlan === 'pro'
                          ? 'Pro – KES 5,000 / month'
                          : 'Starter – KES 0 / month (default)'}
                      </Badge>
                      <Badge
                        className={
                          seller.brandingEnabled ? 'bg-emerald-500/20 text-emerald-600' : ''
                        }
                      >
                        {seller.brandingEnabled ? 'White label enabled' : 'Platform brand'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60 mt-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Pricing Plan
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={seller.pricingPlan === 'starter' || !seller.pricingPlan ? 'default' : 'outline'}
                          className="text-xs"
                          disabled={savingId === seller.userId}
                          onClick={() => handlePricingChange(seller, 'starter')}
                        >
                          Starter – KES 0
                        </Button>
                        <Button
                          size="sm"
                          variant={seller.pricingPlan === 'growth' ? 'default' : 'outline'}
                          className="text-xs"
                          disabled={savingId === seller.userId}
                          onClick={() => handlePricingChange(seller, 'growth')}
                        >
                          Growth – KES 1,500
                        </Button>
                        <Button
                          size="sm"
                          variant={seller.pricingPlan === 'pro' ? 'default' : 'outline'}
                          className="text-xs"
                          disabled={savingId === seller.userId}
                          onClick={() => handlePricingChange(seller, 'pro')}
                        >
                          Pro – KES 5,000
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Paintbrush className="w-3 h-3" />
                        White-label Branding
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="sm"
                          variant={seller.brandingEnabled ? 'default' : 'outline'}
                          className="text-xs"
                          disabled={savingId === seller.userId}
                          onClick={() => handleBrandingToggle(seller, !seller.brandingEnabled)}
                        >
                          {seller.brandingEnabled ? 'Disable White Label' : 'Enable White Label'}
                        </Button>
                      </div>
                      {seller.brandingEnabled && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Brand name (e.g. seller's shop name)"
                            value={seller.brandingName ?? ''}
                            onChange={(e) =>
                              handleBrandingNameChange(seller.userId, e.target.value)
                            }
                            className="h-9 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={savingId === seller.userId}
                            onClick={() => handleBrandingSave(seller)}
                          >
                            Save Branding
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

