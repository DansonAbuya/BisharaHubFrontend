'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationDto,
  type NotificationType,
} from '@/lib/api'

interface NotificationsContextType {
  notifications: NotificationDto[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listNotifications()
        if (!cancelled) setNotifications(data)
      } catch {
        if (!cancelled) setNotifications([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await markNotificationRead(id)
    } catch {
      // ignore errors; UI stays optimistic
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      // ignore errors
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}
