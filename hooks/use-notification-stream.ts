"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { subscribeNotificationStream } from "@/lib/api/notifications"
import { useSessionRegistry } from "@/lib/session/session-registry"

const REATTACH_STATUSES = new Set(["executing", "awaiting_input"])

type NotificationStreamEvent = {
  type?: string
  activityId?: string
  activity_id?: string
  status?: string
  title?: string
  message?: string
  body?: string
}

export function useNotificationStream(onNotification?: () => void | Promise<void>) {
  const { getToken, isSignedIn } = useAuth()
  const { attachActivitySession, markActivityNeedsInput } = useSessionRegistry()

  useEffect(() => {
    if (!isSignedIn) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false
    let retryTimer: number | undefined

    async function connect() {
      const token = await getToken()
      if (cancelled) return

      unsubscribe?.()
      unsubscribe = subscribeNotificationStream(token, {
        onEvent: (raw) => {
          const event = normalizeNotificationStreamEvent(raw)
          void onNotification?.()

          if (event.title || event.message || event.body) {
            toast.message(event.title ?? "Athena update", {
              description: event.message ?? event.body,
            })
          }

          const activityId = event.activityId ?? event.activity_id
          if (!activityId) return

          if (event.status === "awaiting_input") {
            markActivityNeedsInput(activityId)
          }

          if (event.status && REATTACH_STATUSES.has(event.status)) {
            attachActivitySession(activityId, event.status)
          }
        },
        onError: () => {
          if (cancelled) return
          retryTimer = window.setTimeout(() => {
            if (!cancelled) void connect()
          }, 5000)
        },
      })
    }

    void connect()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      unsubscribe?.()
    }
  }, [attachActivitySession, getToken, isSignedIn, markActivityNeedsInput, onNotification])
}

function normalizeNotificationStreamEvent(raw: unknown): NotificationStreamEvent {
  if (!raw || typeof raw !== "object") return {}
  const record = raw as Record<string, unknown>
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record

  return {
    type: stringValue(record.type ?? data.type),
    activityId: stringValue(record.activityId ?? data.activityId),
    activity_id: stringValue(record.activity_id ?? data.activity_id),
    status: stringValue(record.status ?? data.status),
    title: stringValue(record.title ?? data.title),
    message: stringValue(record.message ?? data.message),
    body: stringValue(record.body ?? data.body),
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}
