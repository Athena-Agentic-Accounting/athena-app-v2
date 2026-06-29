"use client"

import { useCallback } from "react"

import { useActivityBoard } from "@/components/providers/activity-board-provider"
import { useNotifications } from "@/components/providers/notifications-provider"
import { useNotificationStream } from "@/hooks/use-notification-stream"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function AppRuntime() {
  const { refreshBoard } = useActivityBoard()
  const { refreshNotifications } = useNotifications()

  const handleNotification = useCallback(async () => {
    await Promise.all([refreshBoard(), refreshNotifications()])
  }, [refreshBoard, refreshNotifications])

  useNotificationStream(handleNotification)
  usePushNotifications()

  return null
}
