"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

import { canUsePushNotifications, registerPushNotifications } from "@/lib/notifications/push"

/**
 * Keeps an existing push subscription registered with the engine. Never
 * prompts for permission — that requires a user gesture and lives in the
 * notification popover's enable toggle.
 */
export function usePushNotifications() {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    async function register() {
      try {
        if (!canUsePushNotifications()) return
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
