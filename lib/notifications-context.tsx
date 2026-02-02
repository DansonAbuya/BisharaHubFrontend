'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type NotificationType = 'order' | 'shipment' | 'payment' | 'system' | 'alert'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (type: NotificationType, title: string, message: string, actionUrl?: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      type: 'order',
      title: 'Order Confirmed',
      message: 'Your order ORD-2026-001 has been confirmed',
      timestamp: new Date(Date.now() - 10 * 60000), // 10 minutes ago
      read: false,
      actionUrl: '/dashboard/orders',
    },
    {
      id: 'notif-2',
      type: 'shipment',
      title: 'Shipment In Transit',
      message: 'Your delivery is on the way. Tracking: EXP-2026-12345',
      timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
      read: false,
      actionUrl: '/dashboard/shipments',
    },
    {
      id: 'notif-3',
      type: 'system',
      title: 'New Features Available',
      message: 'Check out our new wishlist and tracking features',
      timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
      read: true,
    },
  ])

  const addNotification = useCallback(
    (type: NotificationType, title: string, message: string, actionUrl?: string) => {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        actionUrl,
      }
      setNotifications((prev) => [newNotification, ...prev])
    },
    [],
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }, [])

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
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
