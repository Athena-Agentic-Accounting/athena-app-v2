"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

import { registerPushNotifications } from "@/lib/notifications/push"

export function usePushNotifications() {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    async function register() {
      try {
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission()
          if (permission !== "granted") return
        }

        if (Notification.permission !== "granted") return

        const token = await getToken()
        if (cancelled) return
        await registerPushNotifications(token)
      } catch {
        // Push is best-effort. App-level SSE and poll-on-load still handle reattach.
      }
    }

    void register()

    return () => {
      cancelled = true
    }
  }, [getToken, isSignedIn])
}
