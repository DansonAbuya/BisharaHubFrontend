'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getSellerConfig, setSellerPricingPlan, setSellerBranding, setSellerGrowthConfig } from '@/lib/actions/admin'
import type { SellerConfigDto } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLoading } from '@/components/layout/page-loading'
import { ArrowLeft, Paintbrush, Settings2, BarChart3, Truck, MessageCircle, Package } from 'lucide-react'

export default function AdminSellerSetupPage() {
  const params = useParams()
  const ownerId = params?.ownerId as string
  const { user } = useAuth()
  const [seller, setSeller] = useState<SellerConfigDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  useEffect(() => {
    if (!isPlatformAdmin || !ownerId) {
      setLoading(false)
      return
    }
    getSellerConfig(ownerId)
      .then((config) => {
        setSeller(config ?? null)
        if (config === null) setError('Seller not found')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load seller')
      })
      .finally(() => setLoading(false))
  }, [isPlatformAdmin, ownerId])

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

  if (loading) {
    return <PageLoading message="Loading seller…" minHeight="200px" />
  }

  if (!seller) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/admin/seller-config">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sellers
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Seller not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const plan = (seller.pricingPlan || 'starter').toLowerCase()

  const handlePricingChange = async (pricingPlan: string) => {
    setSaving(true)
    setError('')
    try {
      const updated = await setSellerPricingPlan(seller.userId, pricingPlan)
      setSeller(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing plan')
    } finally {
      setSaving(false)
    }
  }

  const handleBrandingSave = async (branding: {
    brandingEnabled: boolean
    brandingName: string | null
    brandingLogoUrl: string | null
    brandingPrimaryColor: string | null
    brandingSecondaryColor: string | null
  }) => {
    setSaving(true)
    setError('')
    try {
      const updated = await setSellerBranding(seller.userId, branding)
      setSeller(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/seller-config">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sellers
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">
          {seller.businessName || seller.name || seller.email}
        </h1>
        <p className="text-muted-foreground text-sm">{seller.email}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">
            {plan === 'starter'
              ? 'Starter – KES 0 / month'
              : plan === 'growth'
                ? 'Growth – KES 1,500 / month'
                : 'Pro – KES 5,000 / month'}
          </Badge>
          {seller.brandingEnabled && (
            <Badge className="bg-emerald-500/20 text-emerald-600">White label enabled</Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pricing plan selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Pricing Plan
          </CardTitle>
          <CardDescription>
            Change the seller&apos;s plan here. Plan-specific setup sections appear below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={plan === 'starter' ? 'default' : 'outline'}
              disabled={saving}
              onClick={() => handlePricingChange('starter')}
            >
              Starter – KES 0
            </Button>
            <Button
              size="sm"
              variant={plan === 'growth' ? 'default' : 'outline'}
              disabled={saving}
              onClick={() => handlePricingChange('growth')}
            >
              Growth – KES 1,500
            </Button>
            <Button
              size="sm"
              variant={plan === 'pro' ? 'default' : 'outline'}
              disabled={saving}
              onClick={() => handlePricingChange('pro')}
            >
              Pro – KES 5,000
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Starter: no setup */}
      {plan === 'starter' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Starter plan</CardTitle>
            <CardDescription>
              No additional setup required. Sellers on Starter use the BiasharaHub brand and
              commission-only billing.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Growth: feature toggles — when enabled, these are active for this seller */}
      {plan === 'growth' && (
        <GrowthPlanSetup
          seller={seller}
          saving={saving}
          setSeller={setSeller}
          setSaving={setSaving}
          setError={setError}
        />
      )}

      {/* Pro: white-label setup */}
      {plan === 'pro' && (
        <ProWhiteLabelSetup
          seller={seller}
          saving={saving}
          onSave={handleBrandingSave}
        />
      )}
    </div>
  )
}

function GrowthPlanSetup({
  seller,
  saving,
  setSeller,
  setSaving,
  setError,
}: {
  seller: SellerConfigDto
  saving: boolean
  setSeller: React.Dispatch<React.SetStateAction<SellerConfigDto | null>>
  setSaving: (v: boolean) => void
  setError: (e: string) => void
}) {
  const [inventory, setInventory] = useState(!!seller.growthInventoryAutomation)
  const [whatsapp, setWhatsapp] = useState(!!seller.growthWhatsappEnabled)
  const [analytics, setAnalytics] = useState(!!seller.growthAnalyticsEnabled)
  const [delivery, setDelivery] = useState(!!seller.growthDeliveryIntegrations)

  useEffect(() => {
    setInventory(!!seller.growthInventoryAutomation)
    setWhatsapp(!!seller.growthWhatsappEnabled)
    setAnalytics(!!seller.growthAnalyticsEnabled)
    setDelivery(!!seller.growthDeliveryIntegrations)
  }, [seller])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await setSellerGrowthConfig(seller.userId, {
        growthInventoryAutomation: inventory,
        growthWhatsappEnabled: whatsapp,
        growthAnalyticsEnabled: analytics,
        growthDeliveryIntegrations: delivery,
      })
      setSeller(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Growth config')
    } finally {
      setSaving(false)
    }
  }

  const items = [
    {
      label: 'Inventory automation',
      description: 'Low-stock alerts and restock suggestions for this seller.',
      checked: inventory,
      onCheckedChange: setInventory,
      icon: Package,
    },
    {
      label: 'WhatsApp integration',
      description: 'Order and support notifications via WhatsApp for this seller.',
      checked: whatsapp,
      onCheckedChange: setWhatsapp,
      icon: MessageCircle,
    },
    {
      label: 'Analytics',
      description: 'Sales and traffic insights for this seller.',
      checked: analytics,
      onCheckedChange: setAnalytics,
      icon: BarChart3,
    },
    {
      label: 'Delivery integrations',
      description: 'Courier and logistics links for this seller.',
      checked: delivery,
      onCheckedChange: setDelivery,
      icon: Truck,
    },
  ]

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Growth plan setup
        </CardTitle>
        <CardDescription>
          Enable the features that should be active for this seller. When a toggle is on, that
          feature is active for them (e.g. low-stock alerts, WhatsApp notifications, analytics, delivery).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ label, description, checked, onCheckedChange, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/60 bg-muted/30"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={saving}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Growth plan setup'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ProWhiteLabelSetup({
  seller,
  saving,
  onSave,
}: {
  seller: SellerConfigDto
  saving: boolean
  onSave: (b: {
    brandingEnabled: boolean
    brandingName: string | null
    brandingLogoUrl: string | null
    brandingPrimaryColor: string | null
    brandingSecondaryColor: string | null
  }) => Promise<void>
}) {
  const [enabled, setEnabled] = useState(!!seller.brandingEnabled)
  const [name, setName] = useState(seller.brandingName ?? seller.businessName ?? seller.name ?? '')
  const [logoUrl, setLogoUrl] = useState(seller.brandingLogoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(seller.brandingPrimaryColor ?? '')
  const [secondaryColor, setSecondaryColor] = useState(seller.brandingSecondaryColor ?? '')

  useEffect(() => {
    setEnabled(!!seller.brandingEnabled)
    setName(seller.brandingName ?? seller.businessName ?? seller.name ?? '')
    setLogoUrl(seller.brandingLogoUrl ?? '')
    setPrimaryColor(seller.brandingPrimaryColor ?? '')
    setSecondaryColor(seller.brandingSecondaryColor ?? '')
  }, [seller])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      brandingEnabled: enabled,
      brandingName: enabled ? name || null : null,
      brandingLogoUrl: enabled && logoUrl ? logoUrl : null,
      brandingPrimaryColor: enabled && primaryColor ? primaryColor : null,
      brandingSecondaryColor: enabled && secondaryColor ? secondaryColor : null,
    })
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Paintbrush className="w-5 h-5" />
          White-label store setup
        </CardTitle>
        <CardDescription>
          Configure the seller&apos;s custom store brand. When enabled, their storefront will show
          this name, logo, and colors instead of BiasharaHub.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="branding-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="branding-enabled" className="font-medium text-foreground">
              Enable white-label branding for this seller
            </Label>
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="branding-name">Brand name</Label>
                <Input
                  id="branding-name"
                  placeholder="e.g. My Shop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-logo">Logo URL</Label>
                <Input
                  id="branding-logo"
                  type="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branding-primary">Primary colour</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="branding-primary"
                      value={primaryColor || '#0f766e'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#0f766e"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branding-secondary">Secondary colour</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="branding-secondary"
                      value={secondaryColor || '#134e4a'}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#134e4a"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save white-label branding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
