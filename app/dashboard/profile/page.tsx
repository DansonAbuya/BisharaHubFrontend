'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Phone, MapPin, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const userInitials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  const handleSave = () => {
    setSaved(true)
    setIsEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
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
              <Badge className="mt-2 bg-primary/30 text-primary capitalize">
                {user?.role} Account
              </Badge>
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
                  defaultValue={user?.name}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="mt-2 h-10"
                />
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
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground w-24">Member Since</span>
                <span className="text-foreground">January 2025</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Shipping Address</CardTitle>
          <CardDescription>Default delivery address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Street Address</label>
                <Input
                  placeholder="Enter street address"
                  defaultValue="123 Market Street"
                  className="mt-2 h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">City</label>
                  <Input
                    placeholder="Enter city"
                    defaultValue="Nairobi"
                    className="mt-2 h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Postal Code</label>
                  <Input
                    placeholder="Enter postal code"
                    defaultValue="00100"
                    className="mt-2 h-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Country</label>
                <Input
                  placeholder="Enter country"
                  defaultValue="Kenya"
                  className="mt-2 h-10"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium text-foreground">123 Market Street</p>
                  <p className="text-sm text-muted-foreground">Nairobi, 00100</p>
                  <p className="text-sm text-muted-foreground">Kenya</p>
                </div>
              </div>
              <Badge className="bg-primary/30 text-primary">Default Address</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Contact Information</CardTitle>
          <CardDescription>How we can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  defaultValue="+254 712 345 678"
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Alternative Phone</label>
                <Input
                  placeholder="Enter alternative phone"
                  className="mt-2 h-10"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 py-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground w-32">Phone</span>
                <span className="text-foreground">+254 712 345 678</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground w-32">Email</span>
                <span className="text-foreground">{user?.email}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">KES 485K</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">365 days</div>
            <p className="text-xs text-muted-foreground mt-1">Loyal customer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
