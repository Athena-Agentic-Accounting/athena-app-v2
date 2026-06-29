import { addMinutes } from "date-fns"

import {
  getScheduleNextRunAt,
  getScheduleStartDate,
} from "@/lib/schedules/format-schedule"
import type { ScheduleRecord } from "@/lib/schedules/types"

export type ScheduleCalendarEvent = {
  id: string
  startDate: Date
  endDate: Date
  title: string
  href: string
  type: "active" | "paused"
  timezone?: string
}

export function mapSchedulesToCalendarEvents(
  schedules: ScheduleRecord[],
): ScheduleCalendarEvent[] {
  const events: ScheduleCalendarEvent[] = []

  for (const schedule of schedules) {
    const rawDate = getScheduleNextRunAt(schedule) ?? getScheduleStartDate(schedule)
    if (!rawDate) continue

    const startDate = new Date(rawDate)
    if (Number.isNaN(startDate.getTime())) continue

    events.push({
      id: schedule.id,
      startDate,
      endDate: addMinutes(startDate, 30),
      title: schedule.name,
      href: `/schedules/${schedule.id}`,
      type: schedule.enabled === false ? "paused" : "active",
      timezone: schedule.timezone,
    })
  }

  return events
}
