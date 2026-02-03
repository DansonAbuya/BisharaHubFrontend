'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addAssistantAdmin } from '@/lib/api'
import { UserPlus, ShieldCheck } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

export default function AssistantAdminsPage() {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await addAssistantAdmin({ name, email })
      setSuccess('Assistant admin added. A temporary password has been sent to their email; they must log in and change it. 2FA is always on for assistant admins.')
      setName('')
      setEmail('')
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add assistant admin')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Assistant Admins</h1>
          <p className="text-muted-foreground">
            Platform admins can add assistant administrators. They receive a temporary password by email; 2FA is always on.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsDialogOpen(true)
            setError('')
            setSuccess('')
            setName('')
            setEmail('')
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Assistant Admin
        </Button>
      </div>

      {success && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Assistant admins
          </CardTitle>
          <CardDescription>
            Assistant administrators help manage the platform. They have 2FA always enabled and cannot disable it.
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Assistant Admin</DialogTitle>
            <DialogDescription>
              Enter name and email. A temporary password will be sent to their email. 2FA is always on for this role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                placeholder="Assistant admin full name"
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
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? <><Spinner className="w-4 h-4 mr-2" /> Adding...</> : 'Add Assistant Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
