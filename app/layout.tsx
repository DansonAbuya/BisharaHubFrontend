import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: 'BiasharaHub', template: '%s | BiasharaHub' },
  description: 'Enterprise business management and commerce platform for African SMEs. Orders, products, payments, and analytics.',
  applicationName: 'BiasharaHub',
  manifest: '/manifest.json',
  icons: { icon: '/logo-favicon.png', apple: '/logo-favicon.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BiasharaHub',
  },
  formatDetection: { telephone: false, email: false },
  openGraph: { type: 'website', siteName: 'BiasharaHub' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#2d6a4f' }, { media: '(prefers-color-scheme: dark)', color: '#1b4332' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen min-h-[100dvh] bg-background text-foreground">
        <AuthProvider>
          <NotificationsProvider>
            {children}
            <PwaInstallPrompt />
          </NotificationsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
