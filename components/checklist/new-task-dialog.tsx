"use client"

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react"
import { useAuth } from "@clerk/nextjs"
import {
  RiArrowRightSLine,
  RiAttachment2,
  RiBuildingLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiCollapseDiagonalLine,
  RiExpandDiagonalLine,
  RiLoopLeftLine,
  RiPriceTag3Line,
} from "@remixicon/react"
import { toast } from "sonner"

import { useClient } from "@/components/providers/client-provider"
import { Button } from "@/components/ui/button"
import { useTenantConfig } from "@/hooks/use-tenant-config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { mapActivityToChecklistTask } from "@/lib/activities/map-to-board-task"
import {
  ACTIVITY_RECURRENCE,
  ACTIVITY_TYPES,
  type ActivityRecurrence,
  type ActivityType,
} from "@/lib/activities/types"
import { createActivity } from "@/lib/api/activities"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import {
  CHECKLIST_COLUMNS,
  STATUS_LABELS,
  type ChecklistTask,
  type TaskStatus,
} from "@/lib/checklist/mock-tasks"
import { StatusIcon } from "@/lib/checklist/status-icons"
import { cn } from "@/lib/utils"

type NewTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (task: ChecklistTask) => void
  defaultStatus?: TaskStatus
}

const MetadataPill = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & {
    icon: ComponentType<{ className?: string }>
    label: string
    active?: boolean
  }
>(function MetadataPill(
  { icon: Icon, label, active = false, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-7 max-w-[180px] cursor-pointer items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 text-xs text-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "border-border bg-muted text-foreground",
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </button>
  )
})

function SelectablePill({
  trigger,
  children,
}: {
  trigger: ReactElement
  children: ReactNode
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  )
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onCreated,
  defaultStatus = "to-do",
}: NewTaskDialogProps) {
  const { getToken } = useAuth()
  const { organizationName } = useTenantConfig()
  const { clients, selectedClientId, selectedClient } = useClient()
  const titleRef = useRef<HTMLInputElement>(null)

  const selectableClients = useMemo(
    () => clients.filter((client) => client.id !== ALL_CLIENTS_ID),
    [clients],
  )

  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState("")
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("to-do")
  const [activityType, setActivityType] = useState<ActivityType>("close_task")
  const [recurrence, setRecurrence] = useState<ActivityRecurrence>("none")
  const [startDate, setStartDate] = useState("")
  const [createMore, setCreateMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const defaultClientId =
      selectedClientId !== ALL_CLIENTS_ID
        ? selectedClientId
        : (selectableClients[0]?.id ?? "")

    setExpanded(false)
    setClientId(defaultClientId)
    setTitle("")
    setDescription("")
    setTaskStatus(defaultStatus)
    setActivityType("close_task")
    setRecurrence("none")
    setStartDate("")
    setCreateMore(false)

    const timer = window.setTimeout(() => titleRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, selectedClientId, selectableClients, defaultStatus])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  const selectedClientName =
    selectableClients.find((client) => client.id === clientId)?.name ??
    selectedClient.name

  const typeLabel =
    ACTIVITY_TYPES.find((option) => option.value === activityType)?.label ?? "Type"
  const recurrenceLabel =
    ACTIVITY_RECURRENCE.find((option) => option.value === recurrence)?.label ??
    "Recurrence"
  const statusLabel = STATUS_LABELS[taskStatus]
  const orgLabel = organizationName?.trim() || "Organization"

  async function handleSubmit() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error("Enter a task title.")
      titleRef.current?.focus()
      return
    }

    if (!clientId) {
      toast.error("Select a client for this task.")
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const activity = await createActivity(token, {
        clientId,
        name: trimmedTitle,
        type: activityType,
        recurrence: recurrence === "none" ? undefined : recurrence,
        startDate: startDate || undefined,
      })

      onCreated?.({
        ...mapActivityToChecklistTask(activity),
        status: taskStatus,
      })
      toast.success("Task created", { description: trimmedTitle })

      if (createMore) {
        setTitle("")
        setDescription("")
        titleRef.current?.focus()
        return
      }

      onOpenChange(false)
    } catch (err) {
      toast.error("Could not create task", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[10vh] backdrop-blur-[1px]"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
        className={cn(
          "flex w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl ring-1 ring-black/5 transition-[min-height] duration-200 ease-out",
          expanded ? "min-h-[440px]" : "min-h-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-flex max-w-[140px] items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-foreground">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{orgLabel}</span>
            </span>
            <RiArrowRightSLine className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate text-foreground">New task</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                expanded && "bg-muted text-foreground",
              )}
              aria-label={expanded ? "Collapse dialog" : "Expand dialog"}
              aria-pressed={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <RiCollapseDiagonalLine className="size-3.5" />
              ) : (
                <RiExpandDiagonalLine className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <RiCloseLine className="size-4" />
            </button>
          </div>
        </div>

        <div className={cn("space-y-1 px-4 pt-4", expanded ? "flex-1 pb-4" : "pb-3")}>
          <input
            ref={titleRef}
            id="new-task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={expanded ? "Add description..." : "Add description..."}
            rows={expanded ? 8 : 2}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          <SelectablePill
            trigger={
              <MetadataPill
                icon={({ className }) => (
                  <StatusIcon status={taskStatus} className={cn(className, "text-blue-600")} />
                )}
                label={statusLabel}
                active
              />
            }
          >
            <DropdownMenuContent align="start" className="z-200 min-w-[180px]">
              {CHECKLIST_COLUMNS.map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => setTaskStatus(column.id)}
                  className="gap-2"
                >
                  <StatusIcon status={column.id} className="size-3.5" />
                  <span className="flex-1">{column.label}</span>
                  {taskStatus === column.id ? (
                    <RiCheckLine className="size-3.5 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </SelectablePill>

          <SelectablePill trigger={<MetadataPill icon={RiPriceTag3Line} label={typeLabel} active />}>
            <DropdownMenuContent align="start" className="z-200 min-w-[180px]">
              {ACTIVITY_TYPES.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setActivityType(option.value)}
                  className="gap-2"
                >
                  <span className="flex-1">{option.label}</span>
                  {activityType === option.value ? (
                    <RiCheckLine className="size-3.5 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </SelectablePill>

          <SelectablePill
            trigger={
              <MetadataPill icon={RiBuildingLine} label={selectedClientName} active />
            }
          >
            <DropdownMenuContent align="start" className="z-200 min-w-[220px]">
              {selectableClients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => setClientId(client.id)}
                  className="gap-2"
                >
                  <span className="flex-1">{client.name}</span>
                  {clientId === client.id ? (
                    <RiCheckLine className="size-3.5 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </SelectablePill>

          <SelectablePill
            trigger={
              <MetadataPill
                icon={RiCalendarLine}
                label={startDate ? startDate : "Start date"}
                active={Boolean(startDate)}
              />
            }
          >
            <DropdownMenuContent align="start" className="z-200 p-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Start date</p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none"
                />
                {startDate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 justify-start px-2 text-xs"
                    onClick={() => setStartDate("")}
                  >
                    Clear date
                  </Button>
                ) : null}
              </div>
            </DropdownMenuContent>
          </SelectablePill>

          <SelectablePill trigger={<MetadataPill icon={RiLoopLeftLine} label={recurrenceLabel} />}>
            <DropdownMenuContent align="start" className="z-200 min-w-[180px]">
              {ACTIVITY_RECURRENCE.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setRecurrence(option.value)}
                  className="gap-2"
                >
                  <span className="flex-1">{option.label}</span>
                  {recurrence === option.value ? (
                    <RiCheckLine className="size-3.5 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </SelectablePill>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border/60 px-3 py-2.5">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Attach file"
          >
            <RiAttachment2 className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                role="switch"
                aria-checked={createMore}
                onClick={() => setCreateMore((value) => !value)}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  createMore ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-background shadow-sm ring-1 ring-border/60 transition-transform",
                    createMore ? "left-[18px]" : "left-0.5",
                  )}
                />
              </button>
              Create more
            </label>

            <Button
              size="sm"
              className="h-8 px-4 text-xs"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating…
                </>
              ) : (
                "Create task"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
