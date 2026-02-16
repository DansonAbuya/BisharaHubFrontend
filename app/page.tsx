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
import { listBusinesses } from '@/lib/actions/products'
import type { BusinessDto } from '@/lib/api'
import {
  Store,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ArrowRight,
  MessageCircle,
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
      <div className="flex-1 min-h-0 flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  const displayedShops = shopsByTier.flatMap((t) => t.shops).slice(0, 6)

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-secondary/25">
      <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm z-10 safe-area-pt">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 h-11 sm:h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={28} height={28} className="sm:w-8 sm:h-8" />
            <span className="font-semibold text-foreground text-sm">BiasharaHub</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs sm:text-sm" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 flex justify-center opacity-40">
            <div className="h-32 w-[24rem] rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-emerald-400/30 blur-2xl" />
          </div>

          {/* Hero: single compact row */}
          <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_minmax(0,0.9fr)] items-center">
            <div className="text-center lg:text-left space-y-1.5 sm:space-y-2">
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[0.65rem] sm:text-xs border-primary/30 bg-background/70">
                Built for African SMEs · M-Pesa & WhatsApp
              </Badge>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground leading-tight">
                Run your business <span className="text-primary">end‑to‑end</span> in one place.
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto lg:mx-0 line-clamp-2">
                Launch an online shop, take M-Pesa payments, and let customers browse, order, and pay via WhatsApp 24/7.
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start items-center">
                <Button size="sm" className="h-8 px-4 text-xs" asChild>
                  <Link href="/signup" className="inline-flex items-center gap-1">
                    Get started <ArrowRight className="size-3" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-4 text-xs" asChild>
                  <Link href="/shop" className="inline-flex items-center gap-1">
                    <Store className="size-3" /> Browse shops
                  </Link>
                </Button>
                <div className="flex items-center gap-3 text-[0.65rem] sm:text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MessageCircle className="size-3" />WhatsApp 24/7</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="size-3" />Verified</span>
                  <span className="flex items-center gap-1"><CreditCard className="size-3" />M-Pesa</span>
                  <span className="flex items-center gap-1"><BarChart3 className="size-3" />Dashboard</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block w-full max-w-[280px]">
              <div className="rounded-xl border border-primary/20 bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Today at a glance</span>
                  <Badge variant="secondary" className="text-[0.65rem] font-normal">Demo</Badge>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Orders</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">24</p>
                    <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400 mt-0.5">+12%</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">M-Pesa</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">82K</p>
                    <p className="text-[0.6rem] text-muted-foreground mt-0.5">7 days</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Payouts</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">3</p>
                    <p className="text-[0.6rem] text-muted-foreground mt-0.5">Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Value props: one row, compact */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="border-border bg-card/80">
              <CardHeader className="p-2 sm:p-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mb-1">
                  <MessageCircle className="size-3.5 text-primary" />
                </div>
                <CardTitle className="text-xs font-semibold leading-tight">WhatsApp assistant</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs line-clamp-2">Browse shops, order, pay (M-Pesa), and track delivery 24/7 via chat.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card/80">
              <CardHeader className="p-2 sm:p-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mb-1">
                  <ShieldCheck className="size-3.5 text-primary" />
                </div>
                <CardTitle className="text-xs font-semibold leading-tight">Verified businesses</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs line-clamp-2">Tiered sellers: Informal, SME, Corporate.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card/80">
              <CardHeader className="p-2 sm:p-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mb-1">
                  <CreditCard className="size-3.5 text-primary" />
                </div>
                <CardTitle className="text-xs font-semibold leading-tight">M-Pesa payments</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs line-clamp-2">Pay with M-Pesa; orders update when paid.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card/80">
              <CardHeader className="p-2 sm:p-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mb-1">
                  <BarChart3 className="size-3.5 text-primary" />
                </div>
                <CardTitle className="text-xs font-semibold leading-tight">Orders & analytics</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs line-clamp-2">One dashboard for orders, shipments, insights.</CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* Shops: compact strip + Open shop */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Verified shops</h2>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs shrink-0" asChild>
                <Link href="/shop" className="inline-flex items-center gap-1">
                  <LayoutDashboard className="size-3" /> Open shop
                </Link>
              </Button>
            </div>
            <p className="text-[0.65rem] sm:text-xs text-muted-foreground">
              Browse here or via WhatsApp: list shops, see stock, then reply e.g. ORDER 1 2 to order, and PAY with your order number for M-Pesa.
            </p>
            {shopsLoading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading…</span>
              </div>
            ) : displayedShops.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-2">No shops yet. Sign up to register your business.</p>
                  <Button size="sm" className="h-7 text-xs" asChild>
                    <Link href="/signup">Create account</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {displayedShops.map((shop) => {
                  const label = TIER_LABELS[(shop.sellerTier || 'tier1').toLowerCase()] || shop.sellerTier
                  return (
                    <Card key={shop.id} className="border-border bg-card hover:border-primary/30 transition-colors">
                      <Link href={`/shop?businessId=${encodeURIComponent(shop.id)}`} className="block p-2">
                        <p className="text-xs font-medium text-foreground line-clamp-2">{shop.name}</p>
                        <Badge variant="secondary" className="mt-1 text-[0.6rem] font-normal">{label}</Badge>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
