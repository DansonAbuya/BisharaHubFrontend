'use client'

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
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, verifyCode, pendingTwoFactor, cancelTwoFactor, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const result = await login(email, password)
      if (!result.requiresTwoFactor) router.push('/dashboard')
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
      await verifyCode(pendingTwoFactor.email, code)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    }
  }

  const show2FAStep = !!pendingTwoFactor

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={120} height={120} className="mx-auto" priority />
          </Link>
          <p className="text-muted-foreground text-sm">Business Management Platform for African SMEs</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">
              {show2FAStep ? 'Verify your email' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center">
              {show2FAStep
                ? pendingTwoFactor?.user.role === 'customer'
                  ? `Enter the 6-digit code we sent in your BiasharaHub welcome email to ${pendingTwoFactor.email}. You only need to do this once.`
                  : `We sent a 6-digit code to ${pendingTwoFactor?.email}. Enter it below.`
                : 'Sign in to your account to continue'}
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
                  {isLoading ? <><Spinner className="w-4 h-4 mr-2" /> Verifying...</> : 'Verify and sign in'}
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
              <>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
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
                    {isLoading ? <><Spinner className="w-4 h-4 mr-2" /> Signing in...</> : 'Sign In'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-primary font-medium hover:underline">Sign up as customer</Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">© 2026 BiasharaHub. All rights reserved.</p>
      </div>
    </div>
  )
}
