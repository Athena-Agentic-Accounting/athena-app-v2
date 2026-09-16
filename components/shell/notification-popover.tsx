"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiNotification3Line, RiNotificationBadgeLine } from "@remixicon/react"
import { toast } from "sonner"

import { useNotifications } from "@/components/providers/notifications-provider"
import { Button } from "@/components/ui/button"
import {
  canUsePushNotifications,
  registerPushNotifications,
  unregisterPushNotifications,
} from "@/lib/notifications/push"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useReload } from "@/hooks/use-reload"
import {
  NOTIFICATION_ICON,
  type AppNotification,
} from "@/lib/notifications/mock-notifications"
import { cn } from "@/lib/utils"

function NotificationIcon({ notification }: { notification: AppNotification }) {
  const config = NOTIFICATION_ICON[notification.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-border/40",
        config.className,
      )}
    >
      <Icon className="size-4" />
    </div>
  )
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/70",
        !notification.read && "bg-muted/40",
      )}
      onClick={() => {
        if (!notification.read) onRead(notification.id)
      }}
    >
      <NotificationIcon notification={notification} />
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-normal text-foreground">
            {notification.title}
          </span>
          {!notification.read ? (
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          ) : null}
        </div>
        <span className="text-[11px] leading-snug text-muted-foreground">
          {notification.message}
        </span>
        <span className="text-[10px] text-muted-foreground/80">
          {notification.timeAgo}
        </span>
      </div>
    </button>
  )
}

function PushNotificationsRow() {
  const { getToken } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  const [stateToken, refreshState] = useReload()

  useEffect(() => {
    if (!canUsePushNotifications()) return

    let cancelled = false
    void (async () => {
      let isSubscribed = false
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js")
        isSubscribed = Boolean(await registration?.pushManager.getSubscription())
      } catch {
        isSubscribed = false
      }
      if (cancelled) return
      setPermission(Notification.permission)
      setSubscribed(isSubscribed)
    })()
    return () => {
      cancelled = true
    }
  }, [stateToken])

  if (!canUsePushNotifications() || permission === null) return null

  if (permission === "denied") {
    return (
      <p className="text-[11px] text-muted-foreground">
        Browser notifications are blocked — enable them in your browser settings.
      </p>
    )
  }

  const enabled = permission === "granted" && subscribed

  async function handleToggle() {
    setBusy(true)
    try {
      const token = await getToken()
      if (enabled) {
        await unregisterPushNotifications(token)
      } else {
        // Permission prompts require a user gesture — this click is one.
        const result = await Notification.requestPermission()
        if (result !== "granted") {
          setPermission(result)
          return
        }
        await registerPushNotifications(token)
      }
      refreshState()
    } catch (err) {
      toast.error("Could not update browser notifications", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleToggle()}
      className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <RiNotificationBadgeLine className="size-3.5" />
      {enabled ? "Disable browser notifications" : "Enable browser notifications"}
    </button>
  )
}

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    refreshNotifications,
  } = useNotifications()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    void refreshNotifications()
  }, [open, refreshNotifications])

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort((a, b) => Number(a.read) - Number(b.read)),
    [notifications],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative size-8 text-muted-foreground"
          aria-label="Notifications"
        >
          <RiNotification3Line className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-background" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <PopoverTitle className="text-sm font-normal">Notifications</PopoverTitle>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Mark all read
            </button>
          ) : null}
        </PopoverHeader>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-2 no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-4 text-muted-foreground" />
            </div>
          ) : sortedNotifications.length > 0 ? (
            sortedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={(id) => void markRead(id)}
              />
            ))
          ) : error ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Could not load notifications — {error}
            </p>
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No notifications yet
            </p>
          )}
        </div>
        <Separator />
        <div className="flex flex-col gap-2 px-4 py-2.5">
          <button
            type="button"
            className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => void refreshNotifications()}
          >
            Refresh
          </button>
          <PushNotificationsRow />
        </div>
      </PopoverContent>
    </Popover>
  )
}
