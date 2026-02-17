'use client'

import Link from 'next/link'
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
import { useNotifications } from '@/lib/notifications-context'
import { Bell, LogOut, Settings, Menu, User } from 'lucide-react'

interface TopNavBarProps {
  onMenuClick?: () => void
}

export function TopNavBar({ onMenuClick }: TopNavBarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { unreadCount } = useNotifications()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const userInitials =
    user?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  return (
    <header className="border-b border-border bg-card px-3 sm:px-6 py-3 sm:py-3 flex items-center justify-between gap-2 safe-area-pt">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 min-h-[44px] min-w-[44px]"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
          {user?.businessName ? user.businessName : 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0 min-h-[44px] min-w-[44px] sm:h-10 sm:w-10"
          aria-label="Notifications"
          onClick={() => router.push('/dashboard/notifications')}
        >
          <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 min-w-[0.5rem] h-2 px-1 bg-accent text-[10px] text-accent-foreground rounded-full flex items-center justify-center"
              aria-hidden
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 min-h-[44px] min-w-[44px] sm:h-10 sm:w-10" aria-label="Account menu">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-sm min-h-[44px] cursor-pointer">
              <Link href="/dashboard/profile" className="flex items-center">
                <User className="w-4 h-4 mr-2 shrink-0" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-sm min-h-[44px] cursor-pointer">
              <Link href="/dashboard/settings" className="flex items-center">
                <Settings className="w-4 h-4 mr-2 shrink-0" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive text-sm min-h-[44px] cursor-pointer">
              <LogOut className="w-4 h-4 mr-2 shrink-0" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
