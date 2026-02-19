'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/notifications-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, ArrowRight } from 'lucide-react'

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()

  if (loading) {
    return <PageLoading message="Loading notifications…" minHeight="200px" />
  }

  const handleOpen = async (id: string, actionUrl?: string | null) => {
    await markAsRead(id)
    if (actionUrl) {
      router.push(actionUrl)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Notifications"
        description="See updates about your orders, payments, and deliveries."
        actions={
          notifications.length > 0 && unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent activity
            </CardTitle>
            <CardDescription>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
                : 'You are all caught up.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <Alert className="border-border bg-card/40">
                <AlertDescription className="text-sm">
                  No notifications yet. As you place orders and receive deliveries, updates will show
                  up here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 sm:p-4 border border-border rounded-lg flex items-start justify-between gap-3 ${
                      !n.read ? 'bg-primary/5' : 'bg-card'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm sm:text-base text-foreground">
                          {n.title}
                        </p>
                        {!n.read && (
                          <Badge className="bg-accent text-accent-foreground text-[10px] uppercase tracking-wide">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {n.actionUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleOpen(n.id, n.actionUrl!)}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      {!n.read && !n.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleOpen(n.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}

