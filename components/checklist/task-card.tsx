"use client"

import type { DraggableAttributes } from "@dnd-kit/core"
import {
  Building2,
  CalendarIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChecklistTask } from "@/lib/checklist/mock-tasks"
import { STATUS_LABELS } from "@/lib/checklist/mock-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"
import { cn } from "@/lib/utils"

export type TaskCardAction = "pause" | "resume" | "stop" | "edit"

const STATUS_BADGE_STYLES: Record<ChecklistTask["status"], string> = {
  "needs-action": "bg-amber-50 text-amber-700 border-amber-200",
  "to-do": "bg-muted text-muted-foreground border-border",
  "in-review": "bg-blue-50 text-blue-700 border-blue-200",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

type TaskCardProps = {
  task: ChecklistTask
  onClick?: () => void
  onAction?: (action: TaskCardAction) => void
  isDragging?: boolean
  showClientTag?: boolean
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: Record<string, Function> | undefined
  }
}

function TaskCardMenu({
  task,
  onAction,
}: {
  task: ChecklistTask
  onAction: (action: TaskCardAction) => void
}) {
  const raw = task.rawStatus
  const locked = raw === "completed" || raw === "rejected"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Task actions"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreHorizontalIcon className="size-3.5" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        {raw === "executing" ? (
          <>
            <DropdownMenuItem onSelect={() => onAction("pause")}>
              <PauseIcon className="size-3.5" />
              Pause
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onAction("stop")}
            >
              <SquareIcon className="size-3.5" />
              Stop task
            </DropdownMenuItem>
          </>
        ) : null}
        {raw === "awaiting_input" ? (
          <DropdownMenuItem onSelect={() => onAction("resume")}>
            <PlayIcon className="size-3.5" />
            Resume
          </DropdownMenuItem>
        ) : null}
        {!locked ? (
          <DropdownMenuItem onSelect={() => onAction("edit")}>
            <PencilIcon className="size-3.5" />
            Edit task
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TaskCard({
  task,
  onClick,
  onAction,
  isDragging = false,
  showClientTag = false,
  dragHandleProps,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 border-border/70 py-0 shadow-sm touch-none",
        isDragging && "opacity-50 shadow-md ring-2 ring-primary/20",
        dragHandleProps && "cursor-grab active:cursor-grabbing",
        onClick && !isDragging && "cursor-pointer transition-colors hover:border-primary/30 hover:bg-muted/20",
      )}
      onClick={onClick}
      {...dragHandleProps?.attributes}
      {...dragHandleProps?.listeners}
    >
      <CardContent className="flex flex-col gap-3 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-normal leading-snug">{task.title}</p>
          {onAction && task.rawStatus ? (
            <TaskCardMenu task={task} onAction={onAction} />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "gap-1 rounded-md font-normal",
              STATUS_BADGE_STYLES[task.status],
            )}
          >
            <StatusIcon status={task.status} className="size-3" />
            {STATUS_LABELS[task.status]}
          </Badge>
          <Badge variant="outline" className="rounded-md font-normal text-muted-foreground">
            {task.category}
          </Badge>
          {showClientTag && task.clientName ? (
            <Badge
              variant="outline"
              className="max-w-[160px] gap-1 truncate rounded-md font-normal text-muted-foreground"
            >
              <Building2 className="size-3 shrink-0" />
              <span className="truncate">{task.clientName}</span>
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            {task.dueDate}
          </div>
          <div className="flex -space-x-2">
            {task.assignees.map((initials) => (
              <Avatar key={initials} className="size-6 border-2 border-background">
                <AvatarFallback className="bg-muted text-[10px] font-normal text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
