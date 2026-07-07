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
import { useRouter } from "next/navigation"
import {
  RiArrowRightSLine,
  RiAttachment2,
  RiBuildingLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiCollapseDiagonalLine,
  RiExpandDiagonalLine,
  RiGlobalLine,
  RiLoopLeftLine,
  RiPriceTag3Line,
  RiTimeLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { useClient } from "@/components/providers/client-provider"
import { SkillMentionTextarea } from "@/components/skills/skill-mention-textarea"
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
  ACTIVITY_CATEGORIES,
  ACTIVITY_RECURRENCE,
  DEFAULT_ACTIVITY_CATEGORY,
  type ActivityRecurrence,
  type ActivityType,
} from "@/lib/activities/types"
import { formatActivityCategory } from "@/lib/activities/categories"
import { createActivity } from "@/lib/api/activities"
import { listSkills, type ApiSkill } from "@/lib/api/skills"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import {
  COMMON_TIMEZONES,
  combineStartDateTime,
  getDefaultTimezone,
} from "@/lib/schedules/datetime"
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
  onScheduleCreated?: (scheduleId: string) => void
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
  onScheduleCreated,
  defaultStatus = "to-do",
}: NewTaskDialogProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { organizationName } = useTenantConfig()
  const { clients, selectedClientId, source: clientSource } = useClient()
  const titleRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  const selectableClients = useMemo(
    () => clients.filter((client) => client.id !== ALL_CLIENTS_ID),
    [clients],
  )

  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState("")
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("to-do")
  const [activityType, setActivityType] = useState<ActivityType>(DEFAULT_ACTIVITY_CATEGORY)
  const [recurrence, setRecurrence] = useState<ActivityRecurrence>("none")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [timezone, setTimezone] = useState(getDefaultTimezone)
  const [createMore, setCreateMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [skills, setSkills] = useState<ApiSkill[]>([])
  const [attachedSkillIds, setAttachedSkillIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    const isClientScoped = selectedClientId !== ALL_CLIENTS_ID
    const defaultClientId = isClientScoped ? selectedClientId : ""

    setExpanded(false)
    setClientId(defaultClientId)
    setTitle("")
    setDescription("")
    setTaskStatus(defaultStatus)
    setActivityType(DEFAULT_ACTIVITY_CATEGORY)
    setRecurrence("none")
    setStartDate("")
    setStartTime("09:00")
    setTimezone(getDefaultTimezone())
    setCreateMore(false)
    setAttachedSkillIds([])

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

  useEffect(() => {
    if (!open) return

    let cancelled = false

    void (async () => {
      try {
        const token = await getToken()
        const items = await listSkills(token)
        if (!cancelled) setSkills(items)
      } catch {
        if (!cancelled) setSkills([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getToken, open])

  if (!open) return null

  const selectedClientName =
    selectableClients.find((client) => client.id === clientId)?.name ?? "Select client"

  function openStartDatePicker() {
    const input = dateInputRef.current
    if (!input) return

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker()
        return
      } catch {
        // fall through to click
      }
    }

    input.click()
  }

  function openStartTimePicker() {
    const input = timeInputRef.current
    if (!input) return

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker()
        return
      } catch {
        // fall through to click
      }
    }

    input.focus()
    input.click()
  }

  function formatTimeLabel(value: string): string {
    const [hours, minutes] = value.split(":").map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return value

    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }

  const categoryLabel = formatActivityCategory(activityType)
  const recurrenceLabel =
    ACTIVITY_RECURRENCE.find((option) => option.value === recurrence)?.label ??
    "Recurrence"
  const timezoneLabel =
    timezone.length > 18 ? `${timezone.slice(0, 16)}…` : timezone
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

    if (clientSource !== "api") {
      toast.error("Clients are still loading", {
        description: "Give it a moment and try again.",
      })
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const startDateTime = startDate ? combineStartDateTime(startDate, startTime) : undefined
      const usesScheduleTiming =
        Boolean(startDateTime) || (recurrence !== "none" && recurrence !== undefined)

      const result = await createActivity(token, {
        clientId,
        name: trimmedTitle,
        type: activityType,
        recurrence: recurrence === "none" ? undefined : recurrence,
        startDate: startDateTime,
        timezone: usesScheduleTiming ? timezone : undefined,
        skillIds: attachedSkillIds.length > 0 ? attachedSkillIds : undefined,
      })

      if (result.kind === "schedule") {
        toast.success("Schedule created", { description: trimmedTitle })
        onScheduleCreated?.(result.schedule.id)
        if (!createMore) {
          onOpenChange(false)
          router.push(`/schedules/${result.schedule.id}`)
        } else {
          setTitle("")
          setDescription("")
          setAttachedSkillIds([])
          titleRef.current?.focus()
        }
        return
      }

      onCreated?.({
        ...mapActivityToChecklistTask(result.activity, {
          clientName: selectableClients.find((client) => client.id === clientId)?.name,
        }),
        status: taskStatus,
      })
      toast.success("Task created", { description: trimmedTitle })

      if (createMore) {
        setTitle("")
        setDescription("")
        setAttachedSkillIds([])
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
          <SkillMentionTextarea
            value={description}
            onChange={setDescription}
            attachedSkillIds={attachedSkillIds}
            onAttachedSkillIdsChange={setAttachedSkillIds}
            skills={skills}
            placeholder={expanded ? "Add description… type @ to attach skills" : "Add description… type @ for skills"}
            rows={expanded ? 8 : 2}
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

          <SelectablePill trigger={<MetadataPill icon={RiPriceTag3Line} label={categoryLabel} active />}>
            <DropdownMenuContent align="start" className="z-200 max-h-80 min-w-[320px] overflow-y-auto">
              {ACTIVITY_CATEGORIES.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setActivityType(option.value)}
                  className="gap-2"
                >
                  <span className="flex-1">
                    {option.letter} · {option.label}
                  </span>
                  {activityType === option.value ? (
                    <RiCheckLine className="size-3.5 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </SelectablePill>

          <SelectablePill
            trigger={
              <MetadataPill
                icon={RiBuildingLine}
                label={selectedClientName}
                active={Boolean(clientId)}
              />
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

          <input
            ref={dateInputRef}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <MetadataPill
            icon={RiCalendarLine}
            label={startDate ? `${startDate} ${startTime}` : "Start date"}
            active={Boolean(startDate)}
            onClick={openStartDatePicker}
          />
          {startDate ? (
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear start date"
              onClick={() => setStartDate("")}
            >
              <RiCloseLine className="size-3.5" />
            </button>
          ) : null}

          <SelectablePill trigger={<MetadataPill icon={RiLoopLeftLine} label={recurrenceLabel} active={recurrence !== "none"} />}>
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

          <input
            ref={timeInputRef}
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-label="Start time"
          />
          <MetadataPill
            icon={RiTimeLine}
            label={formatTimeLabel(startTime)}
            active={Boolean(startTime)}
            onClick={openStartTimePicker}
          />

          <SelectablePill
            trigger={
              <MetadataPill
                icon={RiGlobalLine}
                label={timezoneLabel}
                active={Boolean(timezone)}
              />
            }
          >
            <DropdownMenuContent align="start" className="z-200 max-h-80 min-w-[240px] overflow-y-auto">
              {[timezone, ...COMMON_TIMEZONES]
                .filter((value, index, array) => array.indexOf(value) === index)
                .map((value) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setTimezone(value)}
                    className="gap-2"
                  >
                    <span className="flex-1">{value}</span>
                    {timezone === value ? (
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
