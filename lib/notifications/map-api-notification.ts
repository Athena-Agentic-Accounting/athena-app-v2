import type { ApiNotification } from "@/lib/api/notifications"
import type { AppNotification, NotificationType } from "@/lib/notifications/mock-notifications"

function formatTimeAgo(value?: string): string {
  if (!value) return "Just now"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function mapNotificationType(type?: string): NotificationType {
  if (type === "mention" || type === "comment") return "mention"
  if (type === "checklist" || type === "activity" || type === "board") return "checklist"
  return "task"
}

export function mapApiNotification(notification: ApiNotification): AppNotification {
  return {
    id: notification.id,
    type: mapNotificationType(notification.type),
    title: notification.title ?? "Notification",
    message: notification.message ?? notification.body ?? "",
    timeAgo: formatTimeAgo(notification.createdAt ?? notification.created_at),
    read: notification.read ?? notification.isRead ?? false,
  }
}
