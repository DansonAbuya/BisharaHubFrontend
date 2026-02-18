'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

const DISMISS_KEY = 'biasharahub_pwa_install_dismissed'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    const ua = window.navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document))
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    )
    const dismissed = sessionStorage.getItem(DISMISS_KEY)
    if (dismissed === 'true' || isStandalone) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    if (isIOS && !isStandalone) setShow(true)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  useEffect(() => {
    if (isStandalone) setShow(false)
  }, [isStandalone])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-[100] safe-area-pb bg-card border-t border-border shadow-lg px-4 py-3 flex items-center justify-between gap-3 sm:max-w-md sm:left-auto sm:right-4 sm:bottom-4 sm:rounded-xl sm:border"
      aria-label="Install app"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Install BiasharaHub</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isIOS
            ? 'Add to Home Screen for quick access.'
            : 'Use the app offline and get a faster experience.'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt && !isIOS ? (
          <Button size="sm" className="min-h-[44px] min-w-[44px]" onClick={handleInstall}>
            <Download className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Install</span>
          </Button>
        ) : isIOS ? (
          <span className="text-xs text-muted-foreground">
            Safari → Share → Add to Home Screen
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
