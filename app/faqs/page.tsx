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
    a: 'BiasharaHub is a platform that helps small and medium businesses sell products and offer services online. You get an online store, M-Pesa payments, order and booking management, WhatsApp integration for customer orders and notifications, and one dashboard—all in one place. Customers can browse shops, place orders, and get updates via WhatsApp so they can shop and track orders 24/7.',
  },
  {
    q: 'What is the difference between a product seller and a service provider?',
    a: 'Product sellers and service providers have separate onboarding journeys on BiasharaHub.\n\n• Product sellers: Admin onboards you with your business details, tier (Informal, Registered SME, or Corporate), and payout details. You receive a temporary password by email, log in, upload verification documents (ID, business registration, KRA PIN depending on tier), and an admin verifies and approves your business. Once verified, your shop is visible and you can list products.\n\n• Service providers: Admin onboards you with your name, email, and service/business name. You receive a verification code (temporary password) by email, log in, then go to Verification → Offer services to choose your service category, delivery type (online, in-person, or both), and upload verification and qualification/expertise documents (e.g. certificates, licenses). Online services can be delivered via video calls (Zoom, Google Meet, Teams), phone calls, WhatsApp calls, or chat. After submitting, you add your service offerings in Dashboard → Services. An admin reviews your documents and approves; once approved, your services are listed on the platform for customers to book.',
  },
  {
    q: 'How do I start selling products?',
    a: 'An admin onboards your business and sends you a temporary password by email. Log in, go to Verification → Sell products, and upload the required documents for your tier. Once an admin verifies and approves your business, your shop is visible to customers. Add your products in Dashboard → Products, then accept orders and get paid via M-Pesa.',
  },
  {
    q: 'How do I start offering services?',
    a: 'An admin onboards you as a service provider and sends you a verification code (temporary password) by email. Log in, go to Verification → Offer services, choose your service category, how you deliver (online, in-person, or both), and upload verification and qualification documents. Then add your services in Dashboard → Services. Once an admin verifies and approves, your services are listed on the platform for customers to book and pay via M-Pesa.',
  },
  {
    q: 'How can I deliver services online?',
    a: 'If you offer online/virtual services, you can choose from multiple delivery methods when setting up each service:\n\n• Video Call – Live sessions via Zoom, Google Meet, Microsoft Teams, or similar\n• Phone Call – Voice call consultations\n• WhatsApp – Chat, voice, or video calls through WhatsApp\n• Live Chat – Real-time text chat sessions\n• Email – Service delivered via email correspondence\n• Screen Share – Remote desktop or screen sharing sessions for tech support, tutorials\n• File Delivery – Digital files delivered (documents, designs, reports, etc.)\n• Recorded Content – Pre-recorded videos, tutorials, online courses\n• Social Media – Services via Instagram, Facebook, TikTok, or other platforms\n\nWhen creating a service in your dashboard, select all the delivery methods you support. Customers will see how the service will be delivered before booking.',
  },
  {
    q: 'Can I offer services as well as products?',
    a: 'Yes. You can be verified as both a product seller and a service provider. Complete both verification journeys in Verification → Sell products and Verification → Offer services. Once approved for each, you can list products in your shop and services for booking.',
  },
  {
    q: 'How do customers pay?',
    a: 'Customers pay with M-Pesa. They place an order or book a service, then complete payment on their phone. You get notified when payment is received.',
  },
  {
    q: 'Is there a WhatsApp option?',
    a: 'Yes. Customers can browse shops, place orders, and get updates via WhatsApp so they can shop and track orders 24/7. You also receive WhatsApp notifications when you get new orders or bookings.',
  },
  {
    q: 'How do I get verified?',
    a: 'After being onboarded by an admin, log in and go to Verification in your dashboard. For product sellers: upload documents for your tier (ID, business registration, KRA PIN) in Sell products. For service providers: choose your category, delivery type, and upload qualification documents in Offer services. An admin reviews and approves so your products or services can be listed.',
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
