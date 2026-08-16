"use client"

import Link from "next/link"

import { CHECKLIST_COLUMNS, type TaskStatus } from "@/lib/checklist/mock-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"

type HomeStatusCardsProps = {
  counts: Record<TaskStatus, number>
  isLoading?: boolean
}

/**
 * A single inline row of counts rather than four hero stat cards. The numbers
 * are reference information, not the point of the page — the composer is.
 */
export function HomeStatusCards({ counts, isLoading }: HomeStatusCardsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {CHECKLIST_COLUMNS.map((column, index) => (
        <div key={column.id} className="flex items-center">
          {index > 0 ? (
            <span aria-hidden className="px-2 text-border-strong">
              ·
            </span>
          ) : null}
          <Link
            href={`/board?status=${column.id}`}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <StatusIcon status={column.id} className="size-3.5 shrink-0" />
            <span className="tabular-nums text-foreground">
              {isLoading ? "—" : counts[column.id]}
            </span>
            <span>{column.label}</span>
          </Link>
        </div>
      ))}
    </div>
  )
}
