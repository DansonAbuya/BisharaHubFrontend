'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, Settings, Menu } from 'lucide-react'

interface TopNavBarProps {
  onMenuClick?: () => void
}

export function TopNavBar({ onMenuClick }: TopNavBarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const userInitials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="border-b border-border bg-card px-3 sm:px-6 py-4 flex items-center justify-between">
      {/* Left side - Menu and Branding */}
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
          {user?.businessName ? `${user.businessName}` : 'Dashboard'}
        </h1>
      </div>

      {/* Right side - Notifications and Profile */}
      <div className="flex items-center gap-1 sm:gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
        </Button>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive text-sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
