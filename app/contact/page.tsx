'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MessageCircle, ArrowLeft } from 'lucide-react'

export default function ContactPage() {
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
          <h1 className="text-2xl font-bold text-foreground mb-1">Contact us</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Get in touch for support, partnerships, or general enquiries.
          </p>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Email</CardTitle>
              <CardDescription>For business and support enquiries.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Mail className="size-5 text-primary shrink-0" />
              <a href="mailto:support@biasharahub.com" className="text-primary font-medium hover:underline">
                support@biasharahub.com
              </a>
            </CardContent>
          </Card>
          <Card className="border-border mt-4">
            <CardHeader>
              <CardTitle className="text-base">WhatsApp</CardTitle>
              <CardDescription>Chat with us for quick help.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <MessageCircle className="size-5 text-primary shrink-0" />
              <span className="text-muted-foreground text-sm">Available on request via email.</span>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-6">
            BiasharaHub is built by{' '}
            <a href="https://sysnovatechnologies.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Sysnova Technologies
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
