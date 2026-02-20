'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Store,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Sparkles,
  Wrench,
  Package,
  Menu,
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isInitialized) return
    if (user) {
      router.push('/dashboard')
    }
  }, [user, isInitialized, router])

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

  const navLinks = (
    <>
      <Link href="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
        Products
      </Link>
      <Link href="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
        Services
      </Link>
      <Link href="/faqs" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
        FAQs
      </Link>
      <Link href="/contact" className="text-sm font-medium text-primary hover:text-primary/90 transition-colors" onClick={() => setMenuOpen(false)}>
        Contact
      </Link>
      <Button variant="ghost" size="sm" className="h-9 px-3 text-sm" asChild>
        <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
      </Button>
      <Button size="sm" className="h-9 px-4 text-sm font-medium" asChild>
        <Link href="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
      </Button>
    </>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      <header className="shrink-0 z-20 safe-area-pt bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={28} height={28} className="sm:w-8 sm:h-8" />
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
            {navLinks}
          </nav>
          {/* Mobile: hamburger menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,320px)] flex flex-col">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 pt-6">
                <Link href="/shop" className="text-base font-medium" onClick={() => setMenuOpen(false)}>Product shops</Link>
                <Link href="/services" className="text-base font-medium" onClick={() => setMenuOpen(false)}>Service providers</Link>
                <Link href="/faqs" className="text-base font-medium" onClick={() => setMenuOpen(false)}>FAQs</Link>
                <Link href="/contact" className="text-base font-medium" onClick={() => setMenuOpen(false)}>Contact</Link>
                <div className="border-t border-border pt-4 flex flex-col gap-2">
                  <Button className="w-full" asChild>
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
          {/* Hero: tighter spacing */}
          <section className="text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-primary uppercase tracking-wider">
                New
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                M-Pesa · WhatsApp · Products &amp; Services
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight max-w-3xl mx-auto">
              A platform that helps you <span className="text-primary">sell products, offer services, and monetize your expertise</span>.
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Great businesses and skilled professionals deserve one system that does it all — from your online store and M-Pesa payments to service bookings, skills monetization, and one dashboard.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center">
              <Button size="lg" className="h-11 px-6 text-sm font-semibold" asChild>
                <Link href="/signup" className="inline-flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Get started
                </Link>
              </Button>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="h-11 px-6 text-sm font-medium w-full sm:w-auto inline-flex items-center gap-2">
                  <Package className="size-4" />
                  Browse product shops
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="h-11 px-6 text-sm font-medium w-full sm:w-auto inline-flex items-center gap-2">
                  <Wrench className="size-4" />
                  Find service providers
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
              Free to start · Verified businesses · Secure sign-in
            </p>
          </section>

          {/* Trust strip: less margin */}
          <section className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="size-4 text-primary" />
              WhatsApp 24/7
            </span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <ShieldCheck className="size-4 text-primary" />
              Verified
            </span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CreditCard className="size-4 text-primary" />
              M-Pesa
            </span>
          </section>

          {/* Two ways to browse: click to see list of verified shops or service providers */}
          <section className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/shop"
              className="block rounded-xl border-2 border-border bg-card p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Package className="size-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Product sellers</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse verified shops and buy products. Sellers are verified for business registration and documents.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2">
                View verified shops <Store className="size-4" />
              </span>
            </Link>
            <Link
              href="/services"
              className="block rounded-xl border-2 border-border bg-card p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wrench className="size-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Service providers</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Find verified professionals who offer their expertise, skills, and talents for payment — online via video/phone calls, in-person, or both. Qualifications verified.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2">
                View verified service providers <Wrench className="size-4" />
              </span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
