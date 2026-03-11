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
  Truck,
  Users,
  BarChart2,
  PhoneCall,
  CheckCircle2,
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
      <Link
        href="/"
        className="text-sm text-primary font-medium"
        onClick={() => setMenuOpen(false)}
      >
        Home
      </Link>
      <a
        href="#features"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Features
      </a>
      <a
        href="#how-it-works"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        How it works
      </a>
      <a
        href="#pricing"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Pricing
      </a>
      <Link
        href="/contact"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Contact
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 text-sm"
        asChild
      >
        <Link href="/login" onClick={() => setMenuOpen(false)}>
          Sign in
        </Link>
      </Button>
      <Button size="sm" className="h-9 px-4 text-sm font-medium" asChild>
        <Link href="/signup" onClick={() => setMenuOpen(false)}>
          Get Started
        </Link>
      </Button>
    </>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
      <header className="shrink-0 z-20 safe-area-pt bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-favicon.png"
              alt="BiasharaHub"
              width={32}
              height={32}
              className="sm:w-9 sm:h-9"
            />
            <span className="font-semibold text-foreground text-base sm:text-lg">
              BiasharaHub
            </span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 shrink-0">
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
                <Link
                  href="/"
                  className="text-base font-medium text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="#features"
                  className="text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link
                  href="/contact"
                  className="text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="border-t border-border pt-4 flex flex-col gap-2">
                  <Button className="w-full" asChild>
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#f5f7fb]">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 lg:py-12 space-y-12 sm:space-y-14 lg:space-y-16">
          {/* Hero */}
          <section className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-[0.25em] mb-2">
                WhatsApp-powered business platform
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
                <span className="text-emerald-600">Grow</span>{' '}
                <span>Your Business Online</span>
                <span className="block">with Ease</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
                Empowering Kenyan SMEs to let customers browse, order, pay and
                track via WhatsApp while you manage products, services, inventory and deliveries
                from one dashboard.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-md shadow-sm bg-emerald-600 hover:bg-emerald-700"
                  asChild
                >
                  <Link href="/signup">
                    Start Free Trial
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-md border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  asChild
                >
                  <Link href="/contact">
                    Book a Demo
                    <PhoneCall className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Secure &amp; reliable platform</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>M-Pesa payments inside WhatsApp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Automated WhatsApp ordering &amp; updates</span>
                </div>
              </div>
            </div>

            {/* Illustration pane built purely with layout and colors */}
            <div className="relative h-full">
              <div className="absolute -top-6 -right-10 w-64 h-64 rounded-full bg-gradient-to-br from-amber-200 via-orange-100 to-sky-100 opacity-70" />
              <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-200 via-lime-100 to-amber-100 opacity-70" />

              <div className="relative rounded-3xl bg-white shadow-xl border border-slate-100 p-4 sm:p-5 lg:p-6 space-y-4">
                {/* Top bar with logo + text */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl bg-amber-200 flex items-center justify-center">
                      <Store className="h-5 w-5 text-amber-800" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Nairobi Electronics
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Online Shop · BiasharaHub
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    Lipa na M‑Pesa
                  </span>
                </div>

                {/* Middle: character + large phone mock side by side */}
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 sm:gap-4 items-stretch">
                  {/* Character card */}
                  <div className="relative rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 p-3 sm:p-4 overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-amber-300" />
                        <div className="absolute inset-0 translate-y-1 rounded-full bg-amber-900/5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Shop Owner
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Managing orders from tablet
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="h-2.5 w-24 rounded-full bg-white/70" />
                      <div className="h-2.5 w-16 rounded-full bg-white/50" />
                      <div className="mt-2 flex gap-1.5">
                        <div className="h-6 w-10 rounded-md bg-emerald-500/80" />
                        <div className="h-6 w-10 rounded-md bg-amber-400/80" />
                      </div>
                    </div>
                  </div>

                  {/* Phone mock */}
                  <div className="relative flex justify-end">
                    <div className="w-full max-w-[220px] rounded-[26px] bg-slate-900/90 shadow-lg shadow-slate-900/20 px-2.5 pt-2 pb-3">
                      <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-slate-700" />
                      <div className="rounded-2xl bg-white p-2.5 space-y-2">
                        {/* Product image banner */}
                        <div className="h-20 rounded-xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-200 mb-1.5" />
                        {/* Product rows */}
                        <div className="space-y-1.5">
                          {[1, 2, 3].map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2 rounded-lg bg-slate-50 px-1.5 py-1.5"
                            >
                              <div className="h-7 w-7 rounded-md bg-slate-200" />
                              <div className="flex-1 space-y-0.5">
                                <div className="h-1.5 w-16 rounded-full bg-slate-200" />
                                <div className="h-1.5 w-10 rounded-full bg-slate-100" />
                              </div>
                              <div className="h-2 w-6 rounded-full bg-emerald-200" />
                            </div>
                          ))}
                        </div>
                        {/* Checkout strip */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="h-1.5 w-16 rounded-full bg-slate-200" />
                            <div className="h-1.5 w-10 rounded-full bg-slate-100" />
                          </div>
                          <div className="h-7 px-3 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="h-1.5 w-7 rounded-full bg-emerald-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row mimicking small cards under hero */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-1">
                  <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="text-[11px] text-slate-500">Today&apos;s sales</p>
                    <p className="text-sm font-semibold text-slate-900">KES 42,300</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-2.5 py-2">
                    <p className="text-[11px] text-emerald-800">Orders</p>
                    <p className="text-sm font-semibold text-emerald-900">57</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-2.5 py-2">
                    <p className="text-[11px] text-amber-800">Deliveries</p>
                    <p className="text-sm font-semibold text-amber-900">24 out</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core feature strip */}
          <section
            id="features"
            className="grid md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          >
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 sm:p-5">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Accept M-Pesa Payments
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Customers can pay for their orders via Lipa na Mpesa in a few taps.
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 sm:p-5">
              <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-sky-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Manage Inventory Easily
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Track your stock in real-time from purchase to sale, linked to WhatsApp orders.
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 sm:p-5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <Truck className="h-5 w-5 text-amber-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Fast &amp; Reliable Deliveries
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Connect with trusted couriers and keep customers updated on delivery status.
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 sm:p-5">
              <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                WhatsApp Automation
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Customers can place orders, check availability, and receive confirmations and reminders on WhatsApp automatically.
              </p>
            </div>
          </section>

          {/* Everything the platform does – redesigned layout */}
          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase">
                All-in-one platform
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                Everything Your Business Needs in One Place
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl mx-auto">
                BiasharaHub connects WhatsApp, products, services, deliveries and suppliers into one
                simple workspace for your whole business.
              </p>
            </div>

            <div className="grid gap-5 lg:gap-6">
              {/* Row 1 */}
              <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
                <div className="rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 flex gap-4">
                  <div className="mt-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <Store className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                      Sell Products Online
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      Create a storefront, list products, manage stock, and receive WhatsApp and M-Pesa orders.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                      <li>Online &amp; WhatsApp product catalog</li>
                      <li>Customer orders &amp; invoices</li>
                      <li>Discounts &amp; promotions</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 flex gap-4">
                  <div className="mt-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-sky-50">
                    <Wrench className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                      Offer Services &amp; Bookings
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      List your services, manage appointments, and let clients book and confirm via WhatsApp.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                      <li>Service catalog &amp; pricing</li>
                      <li>Availability &amp; bookings</li>
                      <li>Online or in-person sessions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
                <div className="rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 flex gap-4">
                  <div className="mt-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                    <Truck className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                      Deliveries &amp; Operations
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      Keep stock moving from your shop to customers with real-time tracking and WhatsApp status updates.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                      <li>Shipments and deliveries</li>
                      <li>Courier partners &amp; dispatch</li>
                      <li>Delivery status &amp; notifications</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 flex gap-4">
                  <div className="mt-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                    <Package className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                      Suppliers &amp; Purchasing
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      Stay in control of what you buy, from whom, and at what cost so WhatsApp orders never run out of stock.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                      <li>Supplier directory &amp; contacts</li>
                      <li>Purchase orders &amp; restocking</li>
                      <li>Cost &amp; margin visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why choose section */}
          <section className="space-y-6 text-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase">
                Why BiasharaHub
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                Why Choose BiasharaHub?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Built for Kenyan merchants who want an easy way to sell online,
                manage inventory, and grow sales without complex tools.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white border border-slate-100 p-4 text-left">
                <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Easy to Use
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Create your online shop in minutes with no coding.
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-4 text-left">
                <div className="h-9 w-9 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-4 w-4 text-sky-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Secure &amp; Reliable
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Bank-grade security for payments and customer data.
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-4 text-left">
                <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                  <Users className="h-4 w-4 text-amber-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Local Support
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Friendly Kenyan team ready to help you succeed.
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-4 text-left">
                <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <BarChart2 className="h-4 w-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Grow Your Sales
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Powerful analytics to understand and grow your business.
                </p>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section
            id="how-it-works"
            className="space-y-6 bg-white border border-slate-100 rounded-3xl shadow-sm px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          >
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase">
                How It Works
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                WhatsApp at the Heart of Your Business
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 text-center md:text-left">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Step 1
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  Create Your BiasharaHub Account
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sign up as a product seller or service provider, add your business details and connect WhatsApp &amp; M-Pesa.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 text-center md:text-left">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Step 2
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  Set Up Products, Services &amp; Payments
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Add products or services, configure deliveries and staff, and decide what customers can do on WhatsApp.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 text-center md:text-left">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Step 3
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  Run &amp; Grow Your Business
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Customers use WhatsApp to order, check availability, pay and track—while you manage orders, bookings, inventory and analytics from your dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Success stories */}
          <section className="space-y-6">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase">
                Success Stories
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                Success Stories from Our Merchants
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              <div className="rounded-2xl bg-white border border-slate-100 p-5 flex gap-4 items-start">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-sm font-semibold text-amber-800">
                  AK
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    Amina&apos;s Boutique
                  </p>
                  <p className="mt-1 text-sm text-slate-600 italic">
                    &quot;BiasharaHub transformed my business. Sales have
                    doubled in just three months.&quot;
                  </p>
                  <p className="mt-1 text-xs text-slate-500">— Amina K.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-100 p-5 flex gap-4 items-start">
                <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-800">
                  JM
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    Jumbo Electronics
                  </p>
                  <p className="mt-1 text-sm text-slate-600 italic">
                    &quot;Managing orders and payments has never been this
                    easy.&quot;
                  </p>
                  <p className="mt-1 text-xs text-slate-500">— Peter M.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to action & simple footer-style info */}
          <section
            id="pricing"
            className="rounded-3xl bg-emerald-600 text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Ready to Boost Your Business?
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-emerald-50">
                Join hundreds of Kenyan SMEs growing with BiasharaHub today.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="h-11 sm:h-12 px-6 sm:px-8 rounded-full font-semibold text-emerald-900 bg-white hover:bg-emerald-50"
              asChild
            >
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </section>

          <section className="text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span>Quick Links: Lipa na M-Pesa · Visa · MasterCard</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span>Contact us: 0703 520 023</span>
              <span>|</span>
              <span>biasharahub@sysnovatechnilogies.com</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
