import { formatActivityCategory } from "@/lib/activities/categories"
import type { ScheduleRecord, ScheduleRecurrence } from "@/lib/schedules/types"
import { SCHEDULE_RECURRENCE } from "@/lib/schedules/types"

export function getScheduleClientId(schedule: ScheduleRecord): string {
  return schedule.clientId ?? schedule.client_id ?? ""
}

export function getScheduleClientName(schedule: ScheduleRecord): string | undefined {
  return schedule.clientName ?? schedule.client_name
}

export function getScheduleNextRunAt(schedule: ScheduleRecord): string | null | undefined {
  return schedule.nextRunAt ?? schedule.next_run_at
}

export function getScheduleLastRunAt(schedule: ScheduleRecord): string | null | undefined {
  return schedule.lastRunAt ?? schedule.last_run_at
}

export function getScheduleStartDate(schedule: ScheduleRecord): string | null | undefined {
  return schedule.startDate ?? schedule.start_date
}

export function formatRecurrence(value?: string | null): string {
  if (!value || value === "none") return "One-time"
  const match = SCHEDULE_RECURRENCE.find((entry) => entry.value === value)
  if (match) return match.label
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")
}

export function formatScheduleDateTime(
  value?: string | null,
  timezone?: string,
): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || undefined,
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

export function formatScheduleType(type?: string | null): string {
  return formatActivityCategory(type)
}

export function isScheduleRecurring(recurrence?: ScheduleRecurrence | string | null): boolean {
  return Boolean(recurrence && recurrence !== "none")
}
