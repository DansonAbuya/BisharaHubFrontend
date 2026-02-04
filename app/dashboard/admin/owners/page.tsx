'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addOwner } from '@/lib/api'
import { UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function AdminOwnersPage() {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user?.role !== 'super_admin') {
    return (
      <div className="p-8">
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">
              This page is only available to platform administrators.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-4">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await addOwner({ name, email, businessName })
      setSuccess('Owner added. A temporary password has been sent to their email; they must log in and change it.')
      setName('')
      setEmail('')
      setBusinessName('')
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add owner')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Business Owners</h1>
          <p className="text-muted-foreground">
            Platform admins can onboard new business owners. Owners can then add their staff.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsDialogOpen(true)
            setError('')
            setSuccess('')
            setName('')
            setEmail('')
            setBusinessName('')
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Owner
        </Button>
      </div>

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">How it works</CardTitle>
          <CardDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Platform admin adds owners (new business accounts)</li>
              <li>Owners log in and manage their business (products, orders, etc.)</li>
              <li>Owners add staff from the Staff Management page</li>
              <li>Customers sign up themselves from the public sign-up page</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Business Owner</DialogTitle>
            <DialogDescription>
              Enter owner name, email, and business name. A temporary password will be sent to their email; they should log in and change it, and can enable 2FA in Settings. They will be welcomed as the business when they log in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddOwner} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                placeholder="Owner full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="owner@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Business Name</label>
              <Input
                placeholder="e.g. Acme Traders"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Owner'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
