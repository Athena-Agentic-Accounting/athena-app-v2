import type { RemixiconComponentType } from "@remixicon/react"
import {
  RiChat3Line,
  RiListCheck2,
  RiUserSharedLine,
} from "@remixicon/react"

export type NotificationType = "task" | "checklist" | "mention"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timeAgo: string
  read: boolean
}

export const NOTIFICATION_ICON: Record<
  NotificationType,
  { icon: RemixiconComponentType; className: string }
> = {
  task: {
    icon: RiUserSharedLine,
    className: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  checklist: {
    icon: RiListCheck2,
    className: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  mention: {
    icon: RiChat3Line,
    className: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "task",
    title: "Task assigned to you",
    message: "AP Reconciliation / Aging needs your review.",
    timeAgo: "5m ago",
    read: false,
  },
  {
    id: "2",
    type: "checklist",
    title: "Issues update",
    message: "3 tasks moved to In review for Jordan's Lawn Care.",
    timeAgo: "1h ago",
    read: false,
  },
  {
    id: "3",
    type: "mention",
    title: "Comment mention",
    message: "Sarah mentioned you on Bank Reconciliation.",
    timeAgo: "3h ago",
    read: true,
  },
]
