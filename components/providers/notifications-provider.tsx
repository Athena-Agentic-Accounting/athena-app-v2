"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@clerk/nextjs"

import { listNotifications, markNotificationRead } from "@/lib/api/notifications"
import { mapApiNotification } from "@/lib/notifications/map-api-notification"
import type { AppNotification } from "@/lib/notifications/mock-notifications"

type NotificationsContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  refreshNotifications: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      const items = await listNotifications(token, { limit: 20 })
      setNotifications(items.map(mapApiNotification))
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const token = await getToken()
        const items = await listNotifications(token, { limit: 20 })
        if (cancelled) return
        setNotifications(items.map(mapApiNotification))
      } catch {
        if (!cancelled) setNotifications([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [getToken])

  const markRead = useCallback(
    async (notificationId: string) => {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      )

      try {
        const token = await getToken()
        await markNotificationRead(token, notificationId)
      } catch {
        void refreshNotifications()
      }
    },
    [getToken, refreshNotifications],
  )

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.read)
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))

    try {
      const token = await getToken()
      await Promise.all(unread.map((item) => markNotificationRead(token, item.id)))
    } catch {
      void refreshNotifications()
    }
  }, [getToken, notifications, refreshNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return context
}
