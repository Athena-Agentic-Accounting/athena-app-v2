import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiQuestionLine,
} from "@remixicon/react"

import { cn } from "@/lib/utils"
import { getIntegrationHealthLabel } from "@/lib/clients/integration-display"

type HealthTone = "healthy" | "attention" | "disconnected" | "unknown"

function getHealthTone(health?: string): HealthTone {
  if (!health) return "unknown"
  const value = health.toLowerCase()
  if (value.includes("healthy") || value.includes("connected") || value === "ok") {
    return "healthy"
  }
  if (value.includes("error") || value.includes("disconnected") || value.includes("failed")) {
    return "disconnected"
  }
  if (value.includes("partial") || value.includes("pending") || value.includes("warning")) {
    return "attention"
  }
  return "unknown"
}

const toneStyles: Record<
  HealthTone,
  { container: string; icon: typeof RiCheckboxCircleLine }
> = {
  healthy: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: RiCheckboxCircleLine,
  },
  attention: {
    container: "border-amber-200 bg-amber-50 text-amber-700",
    icon: RiAlertLine,
  },
  disconnected: {
    container: "border-red-200 bg-red-50 text-red-700",
    icon: RiCloseCircleLine,
  },
  unknown: {
    container: "border-border bg-muted/40 text-muted-foreground",
    icon: RiQuestionLine,
  },
}

export function IntegrationHealthBadge({ health }: { health?: string }) {
  const tone = getHealthTone(health)
  const styles = toneStyles[tone]
  const Icon = styles.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        styles.container,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {getIntegrationHealthLabel(health)}
    </span>
  )
}
