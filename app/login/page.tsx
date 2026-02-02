'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">BiasharaHub</h1>
          <p className="text-muted-foreground text-sm">Business Management Platform for African SMEs</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
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
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium mb-3">Demo Accounts:</p>
              <div className="space-y-2 text-xs">
                <div className="bg-secondary/30 p-3 rounded-md">
                  <p className="font-medium text-foreground">Owner:</p>
                  <p className="text-muted-foreground">owner@biashara.com / password123</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-md">
                  <p className="font-medium text-foreground">Staff:</p>
                  <p className="text-muted-foreground">staff@biashara.com / password123</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-md">
                  <p className="font-medium text-foreground">Customer:</p>
                  <p className="text-muted-foreground">customer@biashara.com / password123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © 2026 BiasharaHub. All rights reserved.
        </p>
      </div>
    </div>
  )
}
