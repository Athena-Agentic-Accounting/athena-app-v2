"use client"

import { RiAddLine, RiSparklingLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

export function BoardEmptyState({
  title = "Nothing here yet",
  description = "Try asking Athena something, or create your first activity.",
  actionLabel = "Create a new task",
  onAction,
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-inset ring-border/50">
        <RiSparklingLine className="size-5 text-muted-foreground" />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-base font-normal text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {onAction ? (
        <Button size="sm" className="h-9 gap-1.5 px-4 text-xs" onClick={onAction}>
          <RiAddLine className="size-3.5" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
