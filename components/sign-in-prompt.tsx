'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SignInPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional return URL to redirect after login/signup (e.g. /shop) */
  returnUrl?: string
}

export function SignInPrompt({ open, onOpenChange, returnUrl = '/shop' }: SignInPromptProps) {
  const loginHref = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
  const signupHref = returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : '/signup'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Sign in to continue</DialogTitle>
          <DialogDescription>
            Create an account or sign in to add items to your cart and place orders.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={loginHref} onClick={() => onOpenChange(false)}>
              Log in
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={signupHref} onClick={() => onOpenChange(false)}>
              Sign up
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
