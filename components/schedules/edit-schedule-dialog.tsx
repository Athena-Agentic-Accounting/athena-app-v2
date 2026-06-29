"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiCalendarLine, RiCheckLine, RiCloseLine, RiLoopLeftLine, RiPriceTag3Line } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { SelectLikeTrigger } from "@/components/ui/select-like-trigger"
import { Spinner } from "@/components/ui/spinner"
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_RECURRENCE,
  DEFAULT_ACTIVITY_CATEGORY,
  type ActivityRecurrence,
  type ActivityType,
} from "@/lib/activities/types"
import { formatActivityCategory, getActivityCategoryMeta } from "@/lib/activities/categories"
import { updateSchedule } from "@/lib/api/schedules"
import {
  COMMON_TIMEZONES,
  combineStartDateTime,
  splitStartDateTime,
} from "@/lib/schedules/datetime"
import type { ScheduleRecord } from "@/lib/schedules/types"
import { getScheduleStartDate } from "@/lib/schedules/format-schedule"

type EditScheduleDialogProps = {
  schedule: ScheduleRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (schedule: ScheduleRecord) => void
}

export function EditScheduleDialog({
  schedule,
  open,
  onOpenChange,
  onUpdated,
}: EditScheduleDialogProps) {
  const { getToken } = useAuth()
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>("period_close")
  const [recurrence, setRecurrence] = useState<ActivityRecurrence>("monthly")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [timezone, setTimezone] = useState("UTC")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !schedule) return

    const split = splitStartDateTime(getScheduleStartDate(schedule))
    setName(schedule.name)
    setActivityType(getActivityCategoryMeta(schedule.type)?.value ?? DEFAULT_ACTIVITY_CATEGORY)
    setRecurrence((schedule.recurrence as ActivityRecurrence) || "none")
    setStartDate(split.date)
    setStartTime(split.time)
    setTimezone(schedule.timezone || "UTC")
  }, [open, schedule])

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
    if (!schedule) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Enter a schedule name.")
      return
    }

    if (!startDate) {
      toast.error("Choose a start date.")
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const updated = await updateSchedule(token, schedule.id, {
        name: trimmedName,
        type: activityType,
        startDate: combineStartDateTime(startDate, startTime),
        recurrence,
        timezone,
      })
      toast.success("Schedule updated")
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (err) {
      toast.error("Could not update schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit schedule</DialogTitle>
          <DialogDescription>
            Changes reschedule the next run based on the updated start date and recurrence.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="px-1 py-2">
          <Field>
            <FieldLabel htmlFor="edit-schedule-name">Name</FieldLabel>
            <Input
              id="edit-schedule-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
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
              <FieldLabel htmlFor="edit-schedule-time">Start time</FieldLabel>
              <Input
                id="edit-schedule-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="edit-schedule-timezone">Timezone</FieldLabel>
            <NativeSelect
              id="edit-schedule-timezone"
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? <Spinner className="size-3.5" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
