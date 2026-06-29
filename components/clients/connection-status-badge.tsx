import {
  RiAlertLine,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleLine,
} from "@remixicon/react"

import {
  CONNECTION_STATUS_LABELS,
  type ConnectionStatus,
} from "@/lib/clients/connection-status"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { icon: typeof RiCheckboxCircleLine; className: string }
> = {
  connected: {
    icon: RiCheckboxCircleLine,
    className: "text-emerald-600",
  },
  reauth_needed: {
    icon: RiAlertLine,
    className: "text-amber-600",
  },
  not_connected: {
    icon: RiCheckboxBlankCircleLine,
    className: "text-slate-400",
  },
}

type ConnectionStatusBadgeProps = {
  status: ConnectionStatus
  className?: string
}

export function ConnectionStatusBadge({ status, className }: ConnectionStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-foreground",
        className,
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", config.className)} />
      {CONNECTION_STATUS_LABELS[status]}
    </span>
  )
}
