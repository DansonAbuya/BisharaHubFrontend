'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications'
import type { NotificationDto } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface NotificationsContextType {
  notifications: NotificationDto[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  unreadCount: number
  /** True while the initial notifications list is being fetched */
  loading: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch only for the current user; clear when logged out so one user never sees another's notifications
  const NOTIFICATIONS_FETCH_TIMEOUT_MS = 12_000
  useEffect(() => {
    if (!isInitialized) return
    if (!user?.id) {
      setNotifications([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setNotifications([])
        setLoading(false)
      }
    }, NOTIFICATIONS_FETCH_TIMEOUT_MS)
    ;(async () => {
      try {
        const data = await listNotifications()
        if (!cancelled) {
          setNotifications(data)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setNotifications([])
          setLoading(false)
        }
      } finally {
        if (!cancelled) clearTimeout(timeoutId)
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isInitialized, user?.id])

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
        loading,
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
