'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { addStaff, listStaff } from '@/lib/api'
import { UserPlus, Mail, Phone, Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  joinDate: Date
  status: 'active' | 'inactive'
}

export default function StaffManagementPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)

  useEffect(() => {
    if (!(user?.role === 'owner' || user?.role === 'super_admin')) {
      setLoadingStaff(false)
      return
    }
    listStaff()
      .then((users) =>
        setStaff(
          users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            joinDate: new Date(),
            status: 'active' as const,
          })),
        ),
      )
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false))
  }, [user?.role])

  const canManageStaff = user?.role === 'owner' || user?.role === 'super_admin'
  if (!canManageStaff) {
    return (
      <div>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">This page is only available to business owners and platform admins.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'supervisor':
        return 'bg-primary/30 text-primary'
      case 'operator':
        return 'bg-accent/30 text-accent'
      case 'delivery':
        return 'bg-secondary/30 text-foreground'
      case 'staff':
        return 'bg-primary/30 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    setIsSubmitting(true)
    try {
      const newStaff = await addStaff({ name: addName, email: addEmail })
      setStaff((prev) => [
        ...prev,
        {
          id: newStaff.id,
          name: newStaff.name,
          email: newStaff.email,
          role: 'staff',
          joinDate: new Date(),
          status: 'active' as const,
        },
      ])
      setAddName('')
      setAddEmail('')
      setIsDialogOpen(false)
      setAddSuccess(
        'Staff member added. A temporary password has been sent to their email; they can log in and change it. 2FA is always on for staff.',
      )
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {staff.filter((s) => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">Different roles</p>
          </CardContent>
        </Card>
      </div>

      {addSuccess && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertDescription>{addSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card className="border-border">
        <CardHeader>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10"
          />
        </CardHeader>
      </Card>

      {/* Staff List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Team Members</CardTitle>
          <CardDescription>All staff members in your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <div key={member.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{member.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    <Badge
                      className={
                        member.status === 'active'
                          ? 'bg-primary/30 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-3 border-t border-border">
                  <Clock className="w-3 h-3" />
                  Joined {member.joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    View Activity
                  </Button>
                  <Button variant="outline" size="sm" className="ml-auto bg-transparent">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setAddError('')
          setAddName('')
          setAddEmail('')
        } else {
          setAddError('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Staff Member</DialogTitle>
            <DialogDescription>A temporary password will be sent to their email. They must log in and change it; 2FA is always on for staff.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                placeholder="Enter full name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="Enter email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="mt-1 h-10"
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
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
                  'Add Member'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
