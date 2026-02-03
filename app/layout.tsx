import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BiasharaHub - Business Management Platform',
  description: 'Complete business management platform for African SMEs',
  generator: 'v0.app',
  // Favicon and apple touch icon are served from app/icon.png and app/apple-icon.png (file-based metadata)
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
