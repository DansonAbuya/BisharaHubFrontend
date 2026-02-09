'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { listBusinesses, type BusinessDto } from '@/lib/api'
import {
  Store,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

const TIER_LABELS: Record<string, string> = {
  tier1: 'Informal',
  tier2: 'Registered SME',
  tier3: 'Corporate',
}

function groupShopsByTier(shops: BusinessDto[]): { tier: string; label: string; shops: BusinessDto[] }[] {
  const byTier: Record<string, BusinessDto[]> = {}
  for (const shop of shops) {
    const t = (shop.sellerTier || 'tier1').toLowerCase()
    if (!byTier[t]) byTier[t] = []
    byTier[t].push(shop)
  }
  const order = ['tier1', 'tier2', 'tier3']
  return order
    .filter((t) => byTier[t]?.length)
    .map((t) => ({ tier: t, label: TIER_LABELS[t] || t, shops: byTier[t] }))
}

export default function Home() {
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const [shops, setShops] = useState<BusinessDto[]>([])
  const [shopsLoading, setShopsLoading] = useState(true)

  const shopsByTier = useMemo(() => groupShopsByTier(shops), [shops])

  useEffect(() => {
    if (!isInitialized) return
    if (user) {
      router.push('/dashboard')
    }
  }, [user, isInitialized, router])

  useEffect(() => {
    if (!isInitialized || user) return
    let cancelled = false
    listBusinesses()
      .then((list) => { if (!cancelled) setShops(list) })
      .catch(() => { if (!cancelled) setShops([]) })
      .finally(() => { if (!cancelled) setShopsLoading(false) })
    return () => { cancelled = true }
  }, [isInitialized, user])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 safe-area-pt">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-14 min-h-[56px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-h-[44px] items-center">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={32} height={32} className="sm:w-9 sm:h-9" />
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="min-h-[44px]" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Hero */}
        <section className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
            One platform for your business and sales
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Run your SME, list products, take orders, and get paid with M-Pesa. Customers shop from verified businesses—all in one place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="min-h-[48px] px-6" asChild>
              <Link href="/signup" className="inline-flex items-center gap-2">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-h-[48px] px-6" asChild>
              <Link href="/shop" className="inline-flex items-center gap-2">
                <Store className="size-4" />
                Browse shops
              </Link>
            </Button>
          </div>
        </section>

        {/* Value props */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">Verified businesses</CardTitle>
              <CardDescription className="text-sm">Shop from tiered, verified sellers—Informal, SME, or Corporate.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <CreditCard className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">M-Pesa payments</CardTitle>
              <CardDescription className="text-sm">Pay securely with M-Pesa. Orders update when payment is confirmed.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">Orders & analytics</CardTitle>
              <CardDescription className="text-sm">Sellers manage orders, shipments, and insights from one dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Shops */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Verified shops</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Browse by seller tier. Select a shop to see its products.
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px]" asChild>
              <Link href="/shop" className="inline-flex items-center gap-2">
                <LayoutDashboard className="size-4" />
                Open shop
              </Link>
            </Button>
          </div>

          {shopsLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading shops…</p>
              </div>
            </div>
          ) : shopsByTier.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-16 sm:py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No shops yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  Verified businesses will appear here, grouped by tier. Sign up to register your business.
                </p>
                <Button asChild>
                  <Link href="/signup">Create account</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {shopsByTier.map(({ tier, label, shops: tierShops }) => (
                <div key={tier}>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    {label} · {tierShops.length} shop{tierShops.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tierShops.map((shop) => (
                      <Card
                        key={shop.id}
                        className="border-border bg-card hover:shadow-md hover:border-primary/30 transition-colors group"
                      >
                        <Link href={`/shop?businessId=${encodeURIComponent(shop.id)}`} className="block">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {shop.name}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs shrink-0 font-normal">
                                {label}
                              </Badge>
                            </div>
                            {shop.ownerName && (
                              <CardDescription className="text-sm">{shop.ownerName}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                              View products
                              <ArrowRight className="size-3.5" />
                            </span>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer CTA */}
        <section className="mt-16 sm:mt-20 pt-10 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Button variant="outline" asChild>
            <Link href="/login" className="inline-flex items-center gap-2">
              <LayoutDashboard className="size-4" />
              Log in
            </Link>
          </Button>
        </section>
      </main>
    </div>
  )
}
