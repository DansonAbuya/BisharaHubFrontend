import React from 'react'

const SYSNOVA_URL = 'https://sysnovatechnologies.com'

interface FooterProps {
  /** Optional compact style for dashboard (smaller text, less padding) */
  compact?: boolean
  /** Optional extra class name */
  className?: string
}

export function Footer({ compact, className = '' }: FooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer
      className={
        compact
          ? `mt-auto py-3 text-center text-xs text-muted-foreground border-t border-border/50 ${className}`.trim()
          : `mt-8 py-4 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50 ${className}`.trim()
      }
    >
      <p className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span>© {year} BiasharaHub. All rights reserved.</span>
        <span className="hidden sm:inline" aria-hidden>·</span>
        <span>
          @{' '}
          <a
            href={SYSNOVA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground/80 hover:text-primary hover:underline"
          >
            Sysnova Technologies
          </a>
        </span>
      </p>
    </footer>
  )
}
