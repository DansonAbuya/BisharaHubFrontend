'use client'

import { Loader2 } from 'lucide-react'

interface PageLoadingProps {
  /** Optional message below the spinner (default: "Loading...") */
  message?: string
  /** Minimum height so the loading state doesn't shift layout (default: 200px) */
  minHeight?: string
  className?: string
}

/**
 * Full-page or section loading state. Use while fetching data from the API.
 */
export function PageLoading({ message = 'Loading...', minHeight = '200px', className = '' }: PageLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-muted-foreground ${className}`}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className="w-8 h-8 animate-spin shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
