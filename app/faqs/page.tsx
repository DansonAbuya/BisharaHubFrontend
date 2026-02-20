'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ArrowLeft } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'What is BiasharaHub?',
    a: 'BiasharaHub is a platform that helps small and medium businesses sell products and offer services online. You get an online store, M-Pesa payments, order and booking management, and one dashboard—all in one place.',
  },
  {
    q: 'How do I start selling?',
    a: 'Sign up, complete your business verification, then add your products or services. Once verified, your shop is visible to customers. You can accept orders and get paid via M-Pesa.',
  },
  {
    q: 'Can I offer services as well as products?',
    a: 'Yes. You can list services (e.g. consultations, repairs, training) as well as products. Customers can book appointments and pay via M-Pesa. You can offer services online (e.g. video calls) or in person.',
  },
  {
    q: 'How do customers pay?',
    a: 'Customers pay with M-Pesa. They place an order or book a service, then complete payment on their phone. You get notified when payment is received.',
  },
  {
    q: 'Is there a WhatsApp option?',
    a: 'Yes. Customers can browse shops, place orders, and get updates via WhatsApp so they can shop and track orders 24/7.',
  },
  {
    q: 'How do I get verified?',
    a: 'After signing up, go to Verification in your dashboard and submit the required documents for your business type. Once approved, your business can list products and services on the platform.',
  },
]

export default function FAQsPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      <header className="shrink-0 z-10 safe-area-pt bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={28} height={28} className="sm:w-8 sm:h-8" />
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="h-9 px-4 text-sm font-medium" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
          <Button variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground" asChild>
            <Link href="/" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" /> Back to home
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground mb-1">Frequently asked questions</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Quick answers about BiasharaHub and how it works.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
    </div>
  )
}
