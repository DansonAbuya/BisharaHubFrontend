'use server'

import type { NotificationDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function listNotifications(unreadOnly = false): Promise<NotificationDto[]> {
  const path = unreadOnly ? '/notifications?unreadOnly=true' : '/notifications'
  const res = await backendFetch(path)
  if (res.status === 401) return []
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await backendFetch(`/notifications/${id}/read`, { method: 'POST' })
  if (!res.ok && res.status !== 404) throw new Error('Failed to mark notification as read')
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await backendFetch('/notifications/read-all', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to mark notifications as read')
}
