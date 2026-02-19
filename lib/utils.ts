import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format product/amount in main currency unit (exact value, not thousands). Backend sends price in KES. */
export function formatPrice(amount: number | undefined | null): string {
  const n = Number(amount)
  if (Number.isNaN(n)) return 'KES 0'
  return 'KES ' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
