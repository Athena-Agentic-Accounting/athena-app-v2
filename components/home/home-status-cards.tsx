"use client"

import Link from "next/link"

import { CHECKLIST_COLUMNS, type TaskStatus } from "@/lib/checklist/mock-tasks"
import { cn } from "@/lib/utils"

type HomeStatusCardsProps = {
  counts: Record<TaskStatus, number>
  isLoading?: boolean
}

const STATUS_STYLES: Record<
  TaskStatus,
  { accent: string; ring: string }
> = {
  "needs-action": {
    accent: "text-amber-700",
    ring: "ring-amber-200/80",
  },
  "to-do": {
    accent: "text-foreground",
    ring: "ring-border/70",
  },
  "in-review": {
    accent: "text-blue-700",
    ring: "ring-blue-200/80",
  },
  complete: {
    accent: "text-emerald-700",
    ring: "ring-emerald-200/80",
  },
}

export function HomeStatusCards({ counts, isLoading }: HomeStatusCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CHECKLIST_COLUMNS.map((column) => {
        const count = counts[column.id]
        const styles = STATUS_STYLES[column.id]

        return (
          <Link
            key={column.id}
            href={`/board?status=${column.id}`}
            className={cn(
              "rounded-xl border border-border/70 bg-background p-4 shadow-xs ring-1 transition-colors hover:bg-muted/20",
              styles.ring,
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">{column.label}</p>
            <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", styles.accent)}>
              {isLoading ? "—" : count}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {count === 1 ? "activity" : "activities"}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
