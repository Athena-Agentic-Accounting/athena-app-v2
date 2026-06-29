"use client"

import { getVapidPublicKey, subscribePush, unsubscribePush } from "@/lib/api/notifications"

const SERVICE_WORKER_PATH = "/sw.js"

export async function registerPushNotifications(token: string | null): Promise<void> {
  if (!canUsePushNotifications()) return

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH)
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await subscribePush(token, existing)
    return
  }

  const publicKey = await getVapidPublicKey(token)
  if (!publicKey) return

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  await subscribePush(token, subscription)
}

export async function unregisterPushNotifications(token: string | null): Promise<void> {
  if (!canUsePushNotifications()) return

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH)
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  await unsubscribePush(token, subscription.endpoint)
  await subscription.unsubscribe()
}

export function canUsePushNotifications(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index)
  }

  return output
}
