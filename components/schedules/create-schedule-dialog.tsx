"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiBuildingLine, RiCalendarLine, RiCheckLine, RiCloseLine, RiLoopLeftLine, RiPriceTag3Line } from "@remixicon/react"
import { toast } from "sonner"

import { useClient } from "@/components/providers/client-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { SelectLikeTrigger } from "@/components/ui/select-like-trigger"
import { Spinner } from "@/components/ui/spinner"
import type { ScheduleRecord } from "@/lib/schedules/types"
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_RECURRENCE,
  DEFAULT_ACTIVITY_CATEGORY,
  type ActivityRecurrence,
  type ActivityType,
} from "@/lib/activities/types"
import { formatActivityCategory } from "@/lib/activities/categories"
import { createSchedule } from "@/lib/api/schedules"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import {
  COMMON_TIMEZONES,
  combineStartDateTime,
  getDefaultTimezone,
} from "@/lib/schedules/datetime"
import { cn } from "@/lib/utils"

type CreateScheduleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (schedule: ScheduleRecord) => void
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateScheduleDialogProps) {
  const { getToken } = useAuth()
  const { clients, selectedClientId } = useClient()
  const titleRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const selectableClients = useMemo(
    () => clients.filter((client) => client.id !== ALL_CLIENTS_ID),
    [clients],
  )

  const [name, setName] = useState("")
  const [clientId, setClientId] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>(DEFAULT_ACTIVITY_CATEGORY)
  const [recurrence, setRecurrence] = useState<ActivityRecurrence>("monthly")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [timezone, setTimezone] = useState(getDefaultTimezone)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const isClientScoped = selectedClientId !== ALL_CLIENTS_ID
    setName("")
    setClientId(isClientScoped ? selectedClientId : "")
    setActivityType(DEFAULT_ACTIVITY_CATEGORY)
    setRecurrence("monthly")
    setStartDate("")
    setStartTime("09:00")
    setTimezone(getDefaultTimezone())

    const timer = window.setTimeout(() => titleRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, selectedClientId])

  if (!open) return null

  const selectedClientName =
    selectableClients.find((client) => client.id === clientId)?.name ?? "Select client"
  const categoryLabel = formatActivityCategory(activityType)
  const recurrenceLabel =
    ACTIVITY_RECURRENCE.find((option) => option.value === recurrence)?.label ?? "Recurrence"

  function openStartDatePicker() {
    const input = dateInputRef.current
    if (!input) return
    if (typeof input.showPicker === "function") {
      input.showPicker()
      return
    }
    input.click()
  }

  async function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Enter a schedule name.")
      titleRef.current?.focus()
      return
    }

    if (!clientId) {
      toast.error("Select a client for this schedule.")
      return
    }

    if (!startDate) {
      toast.error("Choose a start date.")
      return
    }

    const startDateTime = combineStartDateTime(startDate, startTime)

    setSubmitting(true)
    try {
      const token = await getToken()
      const schedule = await createSchedule(token, {
        clientId,
        name: trimmedName,
        type: activityType,
        startDate: startDateTime,
        recurrence: recurrence === "none" ? undefined : recurrence,
        timezone,
      })
      toast.success("Schedule created", { description: trimmedName })
      onCreated?.(schedule)
      onOpenChange(false)
    } catch (err) {
      toast.error("Could not create schedule", {
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
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-foreground">New schedule</h2>
            <p className="text-xs text-muted-foreground">
              Recurring or future-dated tasks spawn a fresh activity on each run.
            </p>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        <FieldGroup className="gap-4 px-4 py-4">
          <Field>
            <FieldLabel htmlFor="schedule-name">Name</FieldLabel>
            <Input
              ref={titleRef}
              id="schedule-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Month-end book close"
            />
          </Field>

          <Field>
            <FieldLabel>Client</FieldLabel>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SelectLikeTrigger icon={RiBuildingLine}>{selectedClientName}</SelectLikeTrigger>
              </DropdownMenuTrigger>
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
            </DropdownMenu>
          </Field>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SelectLikeTrigger icon={RiPriceTag3Line}>{categoryLabel}</SelectLikeTrigger>
              </DropdownMenuTrigger>
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
            </DropdownMenu>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Start date</FieldLabel>
              <input
                ref={dateInputRef}
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={openStartDatePicker}
              >
                <RiCalendarLine className="size-3.5" />
                {startDate || "Pick date"}
              </Button>
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-time">Start time</FieldLabel>
              <Input
                id="schedule-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="schedule-timezone">Timezone</FieldLabel>
            <NativeSelect
              id="schedule-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {[timezone, ...COMMON_TIMEZONES]
                .filter((value, index, array) => array.indexOf(value) === index)
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel>Recurrence</FieldLabel>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SelectLikeTrigger icon={RiLoopLeftLine}>{recurrenceLabel}</SelectLikeTrigger>
              </DropdownMenuTrigger>
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
            </DropdownMenu>
          </Field>
        </FieldGroup>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? <Spinner className="size-3.5" /> : "Create schedule"}
          </Button>
        </div>
      </div>
    </div>
  )
}
