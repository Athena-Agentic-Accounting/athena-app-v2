"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { PlusIcon } from "lucide-react"

import { BoardEmptyState } from "@/components/checklist/board-empty-state"
import { TaskCard, type TaskCardAction } from "@/components/checklist/task-card"
import {
  CHECKLIST_COLUMNS,
  type ChecklistTask,
  type TaskStatus,
} from "@/lib/checklist/mock-tasks"
import { getTasksByStatusFromList } from "@/lib/checklist/board-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"
import { cn } from "@/lib/utils"

type ChecklistBoardProps = {
  tasks: ChecklistTask[]
  onTasksChange?: (tasks: ChecklistTask[]) => void
  onTaskClick?: (task: ChecklistTask) => void
  onTaskAction?: (task: ChecklistTask, action: TaskCardAction) => void
  onWelcomeCheckClick?: () => void
  onAddTask?: (status: TaskStatus) => void
  showEmptyState?: boolean
  emptyDescription?: string
  showClientTag?: boolean
}

function isColumnStatus(value: unknown): value is TaskStatus {
  return CHECKLIST_COLUMNS.some((column) => column.id === value)
}

function DraggableTaskCard({
  task,
  onClick,
  onAction,
  showClientTag,
}: {
  task: ChecklistTask
  onClick?: () => void
  onAction?: (action: TaskCardAction) => void
  showClientTag?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <TaskCard
        task={task}
        onClick={onClick}
        onAction={onAction}
        isDragging={isDragging}
        showClientTag={showClientTag}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  )
}

function BoardColumn({
  columnId,
  label,
  tasks,
  onTaskClick,
  onTaskAction,
  onWelcomeCheckClick,
  onAddTask,
  isDropTarget,
  showClientTag,
}: {
  columnId: TaskStatus
  label: string
  tasks: ChecklistTask[]
  onTaskClick?: (task: ChecklistTask) => void
  onTaskAction?: (task: ChecklistTask, action: TaskCardAction) => void
  onWelcomeCheckClick?: () => void
  onAddTask?: (status: TaskStatus) => void
  isDropTarget: boolean
  showClientTag?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <section className="flex w-[280px] shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <StatusIcon status={columnId} className="size-4" />
        <h2 className="text-sm font-normal text-foreground">{label}</h2>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-col gap-2.5 rounded-xl p-1 transition-colors",
          (isOver || isDropTarget) && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        )}
      >
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            showClientTag={showClientTag}
            onAction={
              onTaskAction ? (action) => onTaskAction(task, action) : undefined
            }
            onClick={
              task.id === "welcome-check"
                ? onWelcomeCheckClick
                : onTaskClick
                  ? () => onTaskClick(task)
                  : undefined
            }
          />
        ))}

        <button
          type="button"
          aria-label={`Add task to ${label}`}
          onClick={() => onAddTask?.(columnId)}
          className="flex h-8 w-full items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/70 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
        >
          <PlusIcon className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </section>
  )
}

export function ChecklistBoard({
  tasks,
  onTasksChange,
  onTaskClick,
  onTaskAction,
  onWelcomeCheckClick,
  onAddTask,
  showEmptyState = false,
  emptyDescription,
  showClientTag = false,
}: ChecklistBoardProps) {
  const [activeTask, setActiveTask] = useState<ChecklistTask | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  useEffect(() => {
    if (!activeTask && activeColumnId !== null) {
      setActiveColumnId(null)
    }
  }, [activeTask, activeColumnId])

  if (showEmptyState && tasks.length === 0) {
    return (
      <BoardEmptyState
        description={emptyDescription}
        onAction={onAddTask ? () => onAddTask("to-do") : undefined}
      />
    )
  }

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as ChecklistTask | undefined
    setActiveTask(task ?? null)
    if (task) {
      setActiveColumnId(task.status)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setActiveColumnId(null)

    if (!over || !onTasksChange) return

    const taskId = String(active.id)
    const nextStatus = over.id

    if (!isColumnStatus(nextStatus)) return

    const currentTask = tasks.find((task) => task.id === taskId)
    if (!currentTask || currentTask.status === nextStatus) return

    onTasksChange(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task,
      ),
    )
  }

  function handleDragOver(event: { over: { id: string | number } | null }) {
    if (event.over && isColumnStatus(event.over.id)) {
      setActiveColumnId(event.over.id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTask(null)
        setActiveColumnId(null)
      }}
    >
      <div className="no-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain bg-background">
        <div className="flex min-h-full w-max min-w-full gap-3.5 p-5">
          {CHECKLIST_COLUMNS.map((column) => {
            const columnTasks = getTasksByStatusFromList(tasks, column.id)

            return (
              <BoardColumn
                key={column.id}
                columnId={column.id}
                label={column.label}
                tasks={columnTasks}
                onTaskClick={onTaskClick}
                onTaskAction={onTaskAction}
                onWelcomeCheckClick={onWelcomeCheckClick}
                onAddTask={onAddTask}
                isDropTarget={activeColumnId === column.id && activeTask !== null}
                showClientTag={showClientTag}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging showClientTag={showClientTag} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
