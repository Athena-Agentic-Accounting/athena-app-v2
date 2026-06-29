"use client"

import type { DraggableAttributes } from "@dnd-kit/core"
import { Building2, CalendarIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ChecklistTask } from "@/lib/checklist/mock-tasks"
import { STATUS_LABELS } from "@/lib/checklist/mock-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"
import { cn } from "@/lib/utils"

const STATUS_BADGE_STYLES: Record<ChecklistTask["status"], string> = {
  "needs-action": "bg-amber-50 text-amber-700 border-amber-200",
  "to-do": "bg-muted text-muted-foreground border-border",
  "in-review": "bg-blue-50 text-blue-700 border-blue-200",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

type TaskCardProps = {
  task: ChecklistTask
  onClick?: () => void
  isDragging?: boolean
  showClientTag?: boolean
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: Record<string, Function> | undefined
  }
}

export function TaskCard({
  task,
  onClick,
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
        <p className="text-sm font-normal leading-snug">{task.title}</p>

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
