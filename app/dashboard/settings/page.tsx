'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Eye, EyeOff, Lock, Mail, Smartphone, ShieldCheck } from 'lucide-react'
import * as api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

const ROLES_WITH_MANDATORY_2FA = ['customer', 'staff', 'assistant_admin']

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState('')

  const canToggle2FA = user && !ROLES_WITH_MANDATORY_2FA.includes(user.role)
  const twoFAMandatory = user && ROLES_WITH_MANDATORY_2FA.includes(user.role)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    if (!canToggle2FA) return
    setTwoFactorError('')
    setTwoFactorLoading(true)
    try {
      if (enabled) await api.enable2FA()
      else await api.disable2FA()
      setTwoFactorEnabled(enabled)
    } catch (err) {
      setTwoFactorError(err instanceof Error ? err.message : 'Failed to update 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
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
          <CardDescription>Change your password. Owner and staff should change their temporary password after first login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && (
            <Alert className="bg-primary/10 border-primary/30">
              <AlertDescription className="text-primary">Password updated successfully.</AlertDescription>
            </Alert>
          )}
          {passwordError && (
            <Alert variant="destructive">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative mt-2">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative mt-2">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative mt-2">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={changingPassword} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {changingPassword ? <><Spinner className="w-4 h-4 mr-2" /> Updating...</> : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            {twoFAMandatory
              ? '2FA is always on for your account and cannot be disabled.'
              : 'Owner and platform admin can enable or disable 2FA. When enabled, you will receive a code by email at login.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorError && (
            <Alert variant="destructive">
              <AlertDescription>{twoFactorError}</AlertDescription>
            </Alert>
          )}
          {twoFAMandatory ? (
            <Badge className="bg-primary/30 text-primary">2FA always on</Badge>
          ) : (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Enable 2FA (email code at login)</label>
              {twoFactorLoading ? (
                <Spinner className="w-5 h-5" />
              ) : (
                <Switch checked={twoFactorEnabled} onCheckedChange={handle2FAToggle} />
              )}
            </div>
          )}
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
