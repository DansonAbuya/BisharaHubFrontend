'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Mail, Phone, Clock } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: 'supervisor' | 'operator' | 'delivery'
  joinDate: Date
  status: 'active' | 'inactive'
}

const MOCK_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Kofi Mensah',
    email: 'kofi@biashara.com',
    phone: '+233 20 123 4567',
    role: 'supervisor',
    joinDate: new Date('2025-06-15'),
    status: 'active',
  },
  {
    id: 'staff-2',
    name: 'Grace Asante',
    email: 'grace@biashara.com',
    phone: '+233 20 987 6543',
    role: 'operator',
    joinDate: new Date('2025-08-01'),
    status: 'active',
  },
  {
    id: 'staff-3',
    name: 'Benjamin Owusu',
    email: 'benjamin@biashara.com',
    phone: '+233 20 555 1234',
    role: 'delivery',
    joinDate: new Date('2025-09-10'),
    status: 'active',
  },
]

export default function StaffManagementPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  if (user?.role !== 'owner') {
    return (
      <div className="p-8">
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">This page is only available to business owners.</p>
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
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-8 space-y-8">
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
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </div>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Staff Member</DialogTitle>
            <DialogDescription>Fill in the details to add a new team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="Enter full name" className="mt-1 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="Enter email" className="mt-1 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input placeholder="Enter phone number" className="mt-1 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Role</label>
              <select className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background">
                <option>Supervisor</option>
                <option>Operator</option>
                <option>Delivery</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
