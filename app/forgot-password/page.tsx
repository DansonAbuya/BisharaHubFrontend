'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { forgotPassword } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/login" className="inline-block mb-4">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={64} height={64} className="mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">BiasharaHub</h1>
          <p className="text-muted-foreground text-sm">Business Management Platform for African SMEs</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Forgot password</CardTitle>
            <CardDescription className="text-center">
              Enter your email and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription>
                  If an account exists with that email, you will receive a password reset link shortly. Check your inbox and spam folder.
                </AlertDescription>
              </Alert>
            )}

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? <><Spinner className="w-4 h-4 mr-2" /> Sending...</> : 'Send reset link'}
                </Button>
              </form>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">© 2026 BiasharaHub. All rights reserved.</p>
      </div>
    </div>
  )
}
