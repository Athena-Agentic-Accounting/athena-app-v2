"use client"

import type { ProgressCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { cn } from "@/lib/utils"

export function ProgressCard({
  data,
  isLive = false,
}: {
  data: ProgressCardData
  isLive?: boolean
}) {
  const title =
    data.title ??
    (data.stepIndex !== undefined ? `Step ${data.stepIndex}` : getCardTitle("progress"))

  return (
    <CardShell type="progress" title={title} isLive={isLive}>
      <p className="text-sm text-foreground">{data.stepDescription}</p>
      {data.percent !== undefined ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.max(0, Math.min(100, data.percent))}%` }}
          />
        </div>
      ) : (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full w-1/3 rounded-full bg-primary/70",
              isLive && "animate-pulse",
            )}
          />
        </div>
      )}
    </CardShell>
  )
}
