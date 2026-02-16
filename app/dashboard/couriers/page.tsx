'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addCourier, listCouriers } from '@/lib/actions/admin'
import { UserPlus, Truck, Phone } from 'lucide-react'

export default function CouriersManagementPage() {
  const { user } = useAuth()
  const [couriers, setCouriers] = useState<{ id: string; name: string; email: string; phone?: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingCouriers, setLoadingCouriers] = useState(true)

  useEffect(() => {
    if (user?.role !== 'owner') {
      setLoadingCouriers(false)
      return
    }
    listCouriers()
      .then((users) =>
        setCouriers(
          users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
          })),
        ),
      )
      .catch(() => setCouriers([]))
      .finally(() => setLoadingCouriers(false))
  }, [user?.role])

  const canManageCouriers = user?.role === 'owner'
  if (!canManageCouriers) {
    return (
      <div>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">
              This page is only available to business owners.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    if (!addName.trim() || !addEmail.trim() || !addPhone.trim()) {
      setAddError('Name, email and phone are required')
      return
    }
    setIsSubmitting(true)
    try {
      await addCourier({
        name: addName.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim(),
      })
      setAddSuccess('Courier added. A temporary password has been sent to their email.')
      setAddName('')
      setAddEmail('')
      setAddPhone('')
      const updated = await listCouriers()
      setCouriers(
        updated.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: (u as { phone?: string }).phone,
        })),
      )
      setTimeout(() => {
        setIsDialogOpen(false)
        setAddSuccess('')
      }, 2000)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add courier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Couriers</h1>
          <p className="text-muted-foreground mt-1">
            Add couriers to your business. They can use the Courier Portal to view and update deliveries assigned to them.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add courier
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Your couriers</CardTitle>
          <CardDescription>
            Couriers see deliveries when their phone matches the rider phone, or when you assign them to a shipment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCouriers ? (
            <p className="text-sm text-muted-foreground py-4">Loading couriers…</p>
          ) : couriers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No couriers yet</p>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Add a courier to get started. Ensure their phone number matches what you enter as rider phone when dispatching.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                Add your first courier
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {couriers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    {c.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add courier</DialogTitle>
            <DialogDescription>
              Enter the courier&apos;s details. A temporary password will be sent to their email.
              Their phone number must match the rider phone you enter when dispatching shipments.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCourier} className="space-y-4">
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
            {addSuccess && (
              <p className="text-sm text-primary">{addSuccess}</p>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Name</label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Courier name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="courier@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Phone (required for matching)</label>
              <Input
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="e.g. 0712345678 or +254712345678"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding…' : 'Add courier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
