'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { listOrders } from '@/lib/actions/orders'
import { updateMyProfile } from '@/lib/actions/user'
import type { OrderDto } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, MapPin, Phone } from 'lucide-react'
import { PageLoading } from '@/components/layout/page-loading'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [nameEdit, setNameEdit] = useState(user?.name ?? '')
  const [phoneEdit, setPhoneEdit] = useState(user?.phone ?? '')
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const isCustomer = user?.role === 'customer'

  useEffect(() => {
    setNameEdit(user?.name ?? '')
    setPhoneEdit(user?.phone ?? '')
  }, [user?.name, user?.phone])

  useEffect(() => {
    if (!user || !isCustomer) {
      setOrders([])
      setOrdersLoading(false)
      return
    }
    let cancelled = false
    listOrders()
      .then((data) => { if (!cancelled) setOrders(data) })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [user, isCustomer])

  if (isCustomer && ordersLoading) {
    return <PageLoading message="Loading profile…" minHeight="200px" />
  }

  const orderCount = orders.length
  const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)

  const userInitials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  const handleSave = async () => {
    setSaveError('')
    try {
      await updateMyProfile({ name: nameEdit.trim(), phone: phoneEdit.trim() || null })
      await refreshUser()
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success Message */}
      {saved && (
        <Alert className="bg-primary/10 border-primary/30">
          <AlertDescription className="text-primary">
            Profile updated successfully
          </AlertDescription>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Profile Header */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/30 text-primary capitalize">
                  {user?.role} Account
                </Badge>
                {user?.businessName && (
                  <span className="text-sm text-muted-foreground">{user.businessName}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Personal Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  value={nameEdit}
                  onChange={(e) => setNameEdit(e.target.value)}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone (for WhatsApp)</label>
                <Input
                  type="tel"
                  placeholder="e.g. +254712345678 or 0712345678"
                  value={phoneEdit}
                  onChange={(e) => setPhoneEdit(e.target.value)}
                  className="mt-2 h-10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add your WhatsApp number to use our WhatsApp assistant and get order updates.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 py-3">
                <span className="text-sm font-medium text-foreground w-24">Name</span>
                <span className="text-foreground">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground w-24">Email</span>
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-border">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground w-24">Phone</span>
                <span className="text-foreground">{user?.phone || 'Not set'}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Delivery</CardTitle>
          <CardDescription>Where to send your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 py-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <p className="text-sm text-muted-foreground">
              You can add a delivery address when placing an order at checkout.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact / WhatsApp */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Contact & WhatsApp</CardTitle>
          <CardDescription>
            Your phone links your account to our WhatsApp assistant. Add it in Personal Information above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{user?.phone || 'No phone set – add one to use WhatsApp'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Statistics (customers; from API) */}
      {isCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {ordersLoading ? '—' : orderCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {ordersLoading ? '—' : `KES ${(totalSpent / 1000).toFixed(0)}K`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
