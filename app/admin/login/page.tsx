'use client'

/**
 * Admin-only login. Not linked from the platform; only admins access this URL directly.
 * Only super_admin and assistant_admin can proceed; others see "Access denied".
 */
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from '@/components/ui/spinner'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'

const ADMIN_ROLES = ['super_admin', 'assistant_admin'] as const

function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
}

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, verifyCode, pendingTwoFactor, cancelTwoFactor, isLoading, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const result = await login(email, password, { forceUseApi: true })
      if (result.requiresTwoFactor) return
      if (result.user) {
        if (isAdminRole(result.user.role)) {
          router.push('/dashboard')
        } else {
          logout()
          router.push('/')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingTwoFactor || code.length !== 6) {
      setError('Enter the 6-digit code from your email')
      return
    }
    setError('')
    try {
      const user = await verifyCode(pendingTwoFactor.email, code, { forceUseApi: true })
      if (user && isAdminRole(user.role)) {
        router.push('/dashboard')
      } else if (user) {
        logout()
        router.push('/')
      } else {
        setError('Invalid or expired code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    }
  }

  const show2FAStep = !!pendingTwoFactor

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 py-4">
        <div className="text-center">
          <Image src="/logo-favicon.png" alt="BiasharaHub" width={80} height={80} className="mx-auto mb-2" />
          <p className="text-muted-foreground text-sm font-medium">Administrator access</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Admin sign in
            </CardTitle>
            <CardDescription className="text-center">
              {show2FAStep
                ? `Enter the 6-digit code sent to ${pendingTwoFactor?.email}`
                : 'Sign in with an administrator account to manage the platform.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {show2FAStep ? (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-12 rounded-md border border-input" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? <><Spinner className="w-4 h-4 mr-2" /> Verifying...</> : 'Verify and continue'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { cancelTwoFactor(); setCode(''); setError(''); }}
                >
                  Use different account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="admin-email" className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? <><Spinner className="w-4 h-4 mr-2" /> Signing in...</> : 'Sign in'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Not an administrator?{' '}
          <Link href="/" className="text-primary hover:underline">Return to main site</Link>
        </p>
      </div>
    </div>
  )
}
