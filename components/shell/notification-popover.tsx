"use client"

import { useEffect, useMemo, useState } from "react"
import { RiNotification3Line } from "@remixicon/react"

import { useNotifications } from "@/components/providers/notifications-provider"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
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

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    isLoading,
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
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No notifications yet
            </p>
          )}
        </div>
        <Separator />
        <div className="px-4 py-2.5">
          <button
            type="button"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => void refreshNotifications()}
          >
            Refresh
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
