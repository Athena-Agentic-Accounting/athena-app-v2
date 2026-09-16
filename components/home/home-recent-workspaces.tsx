"use client"

import Link from "next/link"
import { useMemo } from "react"
import { RiArrowRightLine, RiLayoutColumnLine } from "@remixicon/react"

import { useActivityBoard } from "@/components/providers/activity-board-provider"
import { CHECKLIST_COLUMNS, type ChecklistTask } from "@/lib/checklist/mock-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  CHECKLIST_COLUMNS.map((col) => [col.id, col.label]),
)

export function HomeRecentWorkspaces() {
  const { tasks, isLoading } = useActivityBoard()

  const displayTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    // Prioritize tasks that need attention or are in progress, then to-do, then completed
    const active = tasks.filter((t) => t.status === "needs-action" || t.status === "in-review")
    const todo = tasks.filter((t) => t.status === "to-do")
    const complete = tasks.filter((t) => t.status === "complete")
    return [...active, ...todo, ...complete].slice(0, 5)
  }, [tasks])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-8">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  if (displayTasks.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No active tasks yet. Describe a task above to get started.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {displayTasks.map((task) => (
          <WorkspaceTaskCard key={task.id} task={task} />
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all tasks on Issues board
          <RiArrowRightLine className="size-3" />
        </Link>
      </div>
    </div>
  )
}

function WorkspaceTaskCard({ task }: { task: ChecklistTask }) {
  const statusLabel = STATUS_LABELS[task.status] ?? task.status

  return (
    <Link
      href={`/activities/${task.id}`}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3.5 transition-all",
        "hover:border-border-strong hover:bg-accent/40 hover:shadow-sm",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground group-hover:text-foreground">
          <RiLayoutColumnLine className="size-4" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
              {task.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {task.clientName ? <span>{task.clientName}</span> : null}
            {task.clientName && task.category ? <span>·</span> : null}
            {task.category ? <span>{task.category}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
          <StatusIcon status={task.status} className="size-3 shrink-0" />
          <span>{statusLabel}</span>
        </div>

        <div className="hidden items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary sm:flex">
          <span>Open workspace</span>
          <RiArrowRightLine className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
