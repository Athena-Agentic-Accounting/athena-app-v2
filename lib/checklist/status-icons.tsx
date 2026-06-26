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

export const STATUS_ICON_CONFIG: Record<TaskStatus, StatusIconConfig> = {
  "needs-action": {
    icon: AlertCircleIcon,
    iconClassName: "text-amber-500",
  },
  "to-do": {
    icon: CircleIcon,
    iconClassName: "text-muted-foreground",
  },
  "in-review": {
    icon: EyeIcon,
    iconClassName: "text-blue-500",
  },
  complete: {
    icon: CheckCircle2Icon,
    iconClassName: "text-emerald-500",
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
