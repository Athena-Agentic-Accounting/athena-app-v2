"use client"

import type { LucideIcon } from "lucide-react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleIcon,
  EyeIcon,
} from "lucide-react"

import type { TaskStatus } from "@/lib/checklist/mock-tasks"

export type StatusIconConfig = {
  icon: LucideIcon
  iconClassName: string
}

// Status is carried by icon shape, not hue. Only needs-action steps up to
// full-strength foreground; everything else stays muted so no single column
// shouts louder than the task titles inside it.
export const STATUS_ICON_CONFIG: Record<TaskStatus, StatusIconConfig> = {
  "needs-action": {
    icon: AlertCircleIcon,
    iconClassName: "text-foreground",
  },
  "to-do": {
    icon: CircleIcon,
    iconClassName: "text-muted-foreground",
  },
  "in-review": {
    icon: EyeIcon,
    iconClassName: "text-muted-foreground",
  },
  complete: {
    icon: CheckCircle2Icon,
    iconClassName: "text-muted-foreground",
  },
}

export function StatusIcon({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  const { icon: Icon, iconClassName } = STATUS_ICON_CONFIG[status]
  return <Icon className={className ?? `size-3.5 shrink-0 ${iconClassName}`} />
}
