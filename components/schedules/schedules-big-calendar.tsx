"use client"

import * as React from "react"
import Link from "next/link"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import {
  addDays,
  addHours,
  differenceInMinutes,
  format,
  isSameDay,
  isSameHour,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfHour,
  subDays,
} from "date-fns"

import type { ScheduleCalendarEvent } from "@/lib/schedules/map-to-calendar"
import { cn } from "@/lib/utils"

const DEFAULT_DAY_START_HOUR = 8
const DEFAULT_DAY_END_HOUR = 18

const getHourRange = (events: ScheduleCalendarEvent[]) => {
  const hours = events.flatMap((event) => [
    event.startDate.getHours(),
    event.endDate.getHours(),
  ])
  return {
    earliestHour: Math.min(...hours),
    latestHour: Math.max(...hours),
  }
}

const generateHours = (baseDate: Date, startHour: number, endHour: number): string[] => {
  const hours: string[] = []
  const clampedStart = Math.max(0, Math.min(23, startHour))
  const clampedEnd = Math.max(clampedStart, Math.min(23, endHour))

  for (let i = clampedStart; i <= clampedEnd; i++) {
    const date = setSeconds(setMinutes(setHours(baseDate, i), 0), 0)
    hours.push(date.toISOString())
  }

  return hours
}

function resolveShowingHours(
  baseDate: Date,
  events: ScheduleCalendarEvent[],
  showAllHours?: boolean,
): string[] {
  if (showAllHours || events.length === 0) {
    return generateHours(baseDate, DEFAULT_DAY_START_HOUR, DEFAULT_DAY_END_HOUR)
  }

  const { earliestHour, latestHour } = getHourRange(events)
  const startHour = Math.max(6, Math.min(earliestHour - 1, DEFAULT_DAY_START_HOUR))
  const endHour = Math.min(21, Math.max(latestHour + 1, DEFAULT_DAY_END_HOUR))

  return generateHours(baseDate, startHour, endHour)
}

type GroupedCalendarData = {
  groupDateStart: Date
  groupDateEnd: Date
  events: ScheduleCalendarEvent[]
}[]

const groupEventsByHour = (events: ScheduleCalendarEvent[]): GroupedCalendarData => {
  const sortedEvents = events
    .slice()
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  const groupedEvents: GroupedCalendarData = []

  for (const event of sortedEvents) {
    const existingGroup = groupedEvents.find(
      ({ groupDateStart, groupDateEnd }) =>
        isSameHour(event.startDate, groupDateStart) &&
        (isSameHour(event.endDate, groupDateEnd) || event.endDate < groupDateEnd),
    )

    if (existingGroup) {
      existingGroup.events.push(event)
      if (event.endDate > existingGroup.groupDateEnd) {
        existingGroup.groupDateEnd = event.endDate
      }
    } else {
      groupedEvents.push({
        groupDateStart: event.startDate,
        groupDateEnd: event.endDate,
        events: [event],
      })
    }
  }

  return groupedEvents
}

const bgColors: Record<ScheduleCalendarEvent["type"], string> = {
  active: "bg-emerald-50 ring-1 ring-emerald-200/80 hover:bg-emerald-100/80",
  paused: "bg-muted ring-1 ring-border/70 hover:bg-muted/80",
}

function CalendarEventItem({
  startDate,
  endDate,
  title,
  href,
  type,
  timezone,
  isTiny,
}: ScheduleCalendarEvent & { isTiny?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col gap-1 overflow-hidden rounded-lg px-3 py-2 transition-colors",
        bgColors[type],
      )}
    >
      <div
        className={cn("text-xs font-medium text-foreground", {
          truncate: isTiny,
        })}
      >
        {title}
      </div>
      <div className="text-[11px] text-muted-foreground">
        {`${format(startDate, "h:mm")} – ${format(endDate, "h:mm aa")}`}
      </div>
      {timezone && !isTiny ? (
        <div className="truncate text-[10px] text-muted-foreground">{timezone}</div>
      ) : null}
    </Link>
  )
}

type SchedulesBigCalendarProps = {
  defaultStartDate: Date
  totalShowingDays?: number
  className?: string
  events: ScheduleCalendarEvent[]
  showAllHours?: boolean
}

export function SchedulesBigCalendar({
  defaultStartDate,
  totalShowingDays = 7,
  events,
  showAllHours,
  className,
}: SchedulesBigCalendarProps) {
  const [currentStartDate, setCurrentStartDate] = React.useState(defaultStartDate)

  React.useEffect(() => {
    setCurrentStartDate(defaultStartDate)
  }, [defaultStartDate])

  const showingDays = Array.from({ length: totalShowingDays }, (_, i) =>
    addDays(currentStartDate, i),
  )

  const hourGridBaseDate = startOfDay(showingDays[0] ?? currentStartDate)
  const showingHours = resolveShowingHours(hourGridBaseDate, events, showAllHours)
  const gridStartHour = startOfHour(new Date(showingHours[0] ?? hourGridBaseDate)).getHours()

  const groupedEvents = groupEventsByHour(events)

  const getRowNumber = (startDate: Date): number => {
    const hours = startDate.getHours() - gridStartHour
    const minutes = startDate.getMinutes()
    return hours * 4 + Math.floor(minutes / 15) + 2
  }

  return (
    <div className="relative -mx-1 overflow-auto px-1 lg:overflow-visible">
      <div className={cn("w-fit min-w-full bg-background lg:w-full", className)}>
        <div className="flex overflow-clip rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5">
          <div className="sticky left-0 z-30 w-[88px] shrink-0 overflow-hidden border-r border-border/70 bg-card">
            <div className="grid h-8 w-full shrink-0 grid-cols-2 divide-x divide-border/70 border-b border-border/70">
              <button
                type="button"
                onClick={() => setCurrentStartDate(subDays(currentStartDate, 1))}
                className="flex items-center justify-center hover:bg-muted/40"
                aria-label="Previous day"
              >
                <RiArrowLeftSLine className="size-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentStartDate(addDays(currentStartDate, 1))}
                className="flex items-center justify-center hover:bg-muted/40"
                aria-label="Next day"
              >
                <RiArrowRightSLine className="size-5 text-muted-foreground" />
              </button>
            </div>
            {showingHours.map((hour, i, arr) => (
              <React.Fragment key={hour}>
                {i === 0 ? <div className="h-10" /> : null}
                <div className="row-span-4 flex h-[120px] items-start justify-center">
                  <div className="-translate-y-1/2 text-center text-xs text-muted-foreground">
                    {format(hour, "h aa")}
                  </div>
                </div>
                {i === arr.length - 1 ? (
                  <div className="flex h-10 items-start justify-center">
                    <div className="-translate-y-1/2 text-center text-xs text-muted-foreground">
                      {format(addHours(showingHours[showingHours.length - 1], 1), "h aa")}
                    </div>
                  </div>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 flex divide-x divide-border/70 border-b border-border/70 bg-muted/30">
              {showingDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="flex h-8 min-w-[160px] flex-1 items-center justify-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {format(day, "dd EEE")}
                </div>
              ))}
            </header>

            <div className="grid w-full content-start items-start">
              <div className="grid w-full grid-flow-col auto-cols-fr divide-x divide-border/70 [grid-area:1/1]">
                {showingDays.map((day) => (
                  <div key={day.toISOString()} className="grid min-w-[160px] divide-y divide-border/70">
                    {showingHours.map((hour, i, arr) => (
                      <React.Fragment key={`${day.toISOString()}-${hour}`}>
                        {i === 0 ? <div className="h-10" /> : null}
                        <div className="row-span-4 h-[120px]" />
                        {i === arr.length - 1 ? <div className="h-10" /> : null}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>

              <div
                className="grid w-full grid-flow-col auto-cols-fr gap-y-px [grid-area:1/1]"
                style={{
                  gridTemplateRows: `40px repeat(${showingHours.length * 4}, 29px) 39px`,
                }}
              >
                {showingDays.map((day, dayColIndex) =>
                  groupedEvents.map(({ groupDateStart, groupDateEnd, events: dayEvents }, groupIndex) => {
                    if (!isSameDay(day, groupDateStart)) return null

                    const rowStart = getRowNumber(groupDateStart)
                    const rowEnd =
                      dayEvents.length === 1
                        ? Math.max(getRowNumber(groupDateEnd), getRowNumber(groupDateStart) + 2)
                        : Math.max(getRowNumber(groupDateEnd), getRowNumber(groupDateStart) + 4)

                    return (
                      <div
                        key={`${day.toISOString()}-${groupIndex}`}
                        className={cn("col-span-1 grid gap-2 px-2 py-1", {
                          "pt-2": rowStart % 4 === 2,
                          "pb-2": rowEnd % 4 === 2,
                        })}
                        style={{
                          gridRowStart: `${rowStart}`,
                          gridRowEnd: `${rowEnd}`,
                          gridColumnStart: dayColIndex + 1,
                        }}
                      >
                        {dayEvents.map((event) => {
                          const isTiny =
                            differenceInMinutes(event.endDate, event.startDate) < 45
                          return (
                            <CalendarEventItem
                              key={event.id}
                              {...event}
                              isTiny={isTiny}
                            />
                          )
                        })}
                      </div>
                    )
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
