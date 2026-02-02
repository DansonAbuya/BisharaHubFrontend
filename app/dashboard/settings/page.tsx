'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Lock, Mail, Smartphone } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Success Message */}
      {saved && (
        <Alert className="bg-primary/10 border-primary/30">
          <AlertDescription className="text-primary">
            Settings saved successfully
          </AlertDescription>
        </Alert>
      )}

      {/* Account Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Account Settings</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {user?.businessName && (
            <div>
              <label className="text-sm font-medium text-foreground">Business Name</label>
              <Input
                defaultValue={user.businessName}
                className="mt-2 h-10"
              />
            </div>
          )}
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              className="mt-2 h-10"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">New Password</label>
            <Input
              type="password"
              placeholder="Enter new password"
              className="mt-2 h-10"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              className="mt-2 h-10"
            />
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4" />
              Email Notifications
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Order Updates</label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Shipment Tracking</label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Promotional Emails</label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Weekly Report</label>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4" />
              SMS Notifications
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Order Confirmations</label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Delivery Status</label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Payment Alerts</label>
                <Switch />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Session & Login History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">Current Session</p>
                <p className="text-sm text-muted-foreground">Chrome on Windows</p>
                <p className="text-xs text-muted-foreground mt-1">Last active: 2 minutes ago</p>
              </div>
              <Badge className="bg-primary/30 text-primary">Active</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full bg-transparent">
            Logout from all other sessions
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
