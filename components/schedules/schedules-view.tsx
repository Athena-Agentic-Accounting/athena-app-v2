"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  RiAddLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCalendarScheduleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiListUnordered,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiSearchLine,
} from "@remixicon/react"
import { startOfWeek } from "date-fns"
import { toast } from "sonner"

import { CreateScheduleDialog } from "@/components/schedules/create-schedule-dialog"
import { EditScheduleDialog } from "@/components/schedules/edit-schedule-dialog"
import { ScheduleTags } from "@/components/schedules/schedule-tags"
import { SchedulesBigCalendar } from "@/components/schedules/schedules-big-calendar"
import { useClient } from "@/components/providers/client-provider"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { deleteSchedule, listSchedules, updateSchedule } from "@/lib/api/schedules"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import { mapSchedulesToCalendarEvents } from "@/lib/schedules/map-to-calendar"
import {
  formatScheduleDateTime,
  getScheduleClientName,
  getScheduleNextRunAt,
} from "@/lib/schedules/format-schedule"
import type { ScheduleRecord } from "@/lib/schedules/types"
import { cn } from "@/lib/utils"

type SchedulesFilter = "all" | "active" | "paused"
type SchedulesViewMode = "list" | "calendar"

const FILTER_OPTIONS: { id: SchedulesFilter; label: string }[] = [
  { id: "all", label: "All schedules" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
]

const VIEW_OPTIONS: { id: SchedulesViewMode; label: string; icon: typeof RiListUnordered }[] = [
  { id: "list", label: "List", icon: RiListUnordered },
  { id: "calendar", label: "Calendar", icon: RiCalendarLine },
]

export function SchedulesView() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { clients, selectedClientId } = useClient()
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<SchedulesFilter>("all")
  const [viewMode, setViewMode] = useState<SchedulesViewMode>("list")
  const [createOpen, setCreateOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<ScheduleRecord | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const clientFilter = selectedClientId !== ALL_CLIENTS_ID ? selectedClientId : null
  const showClientTag = selectedClientId === ALL_CLIENTS_ID

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      if (client.id !== ALL_CLIENTS_ID) map.set(client.id, client.name)
    }
    return map
  }, [clients])

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const items = await listSchedules(token, clientFilter)
      setSchedules(items)
    } catch (err) {
      setSchedules([])
      toast.error("Could not load schedules", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setLoading(false)
    }
  }, [clientFilter, getToken])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  const visibleSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return schedules.filter((schedule) => {
      if (activeFilter === "active" && schedule.enabled === false) return false
      if (activeFilter === "paused" && schedule.enabled !== false) return false

      if (!query) return true

      const clientName =
        getScheduleClientName(schedule) ??
        clientNameById.get(schedule.clientId ?? schedule.client_id ?? "")

      const haystack = [
        schedule.name,
        schedule.type,
        schedule.recurrence,
        schedule.timezone,
        clientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [activeFilter, clientNameById, schedules, searchQuery])

  const calendarEvents = useMemo(
    () => mapSchedulesToCalendarEvents(visibleSchedules),
    [visibleSchedules],
  )

  const calendarStartDate = useMemo(() => {
    if (calendarEvents.length > 0) {
      const earliest = calendarEvents.reduce(
        (min, event) => (event.startDate < min ? event.startDate : min),
        calendarEvents[0].startDate,
      )
      return startOfWeek(earliest, { weekStartsOn: 1 })
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 })
  }, [calendarEvents])

  async function handleToggleEnabled(schedule: ScheduleRecord) {
    setBusyId(schedule.id)
    try {
      const token = await getToken()
      const updated = await updateSchedule(token, schedule.id, {
        enabled: schedule.enabled === false,
      })
      setSchedules((current) =>
        current.map((entry) => (entry.id === schedule.id ? updated : entry)),
      )
      toast.success(updated.enabled === false ? "Schedule paused" : "Schedule resumed")
    } catch (err) {
      toast.error("Could not update schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(schedule: ScheduleRecord) {
    if (!window.confirm(`Delete schedule "${schedule.name}"? This cancels future runs.`)) return

    setBusyId(schedule.id)
    try {
      const token = await getToken()
      await deleteSchedule(token, schedule.id)
      setSchedules((current) => current.filter((entry) => entry.id !== schedule.id))
      toast.success("Schedule deleted")
    } catch (err) {
      toast.error("Could not delete schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Schedules"
        description="Recurring and future-dated activities that spawn fresh runs"
        icon={RiCalendarScheduleLine}
        showSearch={false}
        actionLabel="New schedule"
        onAction={() => setCreateOpen(true)}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search schedules..."
                className="h-9 bg-background pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <div className="inline-flex w-fit rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50">
                {FILTER_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      activeFilter === tab.id
                        ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex w-fit shrink-0 rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setViewMode(option.id)}
                    aria-label={option.label}
                    title={option.label}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                      viewMode === option.id
                        ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {schedules.length === 0
                  ? "No schedules yet. Create one for recurring or future-dated work."
                  : "No schedules match your filters."}
              </p>
              {schedules.length === 0 ? (
                <Button size="sm" className="mt-4 gap-1.5" onClick={() => setCreateOpen(true)}>
                  <RiAddLine className="size-3.5" />
                  Create your first schedule
                </Button>
              ) : null}
            </div>
          ) : viewMode === "calendar" ? (
            <SchedulesBigCalendar
              defaultStartDate={calendarStartDate}
              events={calendarEvents}
              totalShowingDays={7}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5">
              {visibleSchedules.map((schedule, index) => {
                const clientName =
                  getScheduleClientName(schedule) ??
                  clientNameById.get(schedule.clientId ?? schedule.client_id ?? "")
                const nextRun = getScheduleNextRunAt(schedule)
                const isBusy = busyId === schedule.id
                const isPaused = schedule.enabled === false

                return (
                  <article key={schedule.id}>
                    {index > 0 ? <div className="border-t border-border/60" /> : null}
                    <div className="flex items-start gap-3 px-4 py-4">
                      <Link
                        href={`/schedules/${schedule.id}`}
                        className="group min-w-0 flex-1"
                      >
                        <h3 className="text-sm font-medium text-foreground group-hover:underline">
                          {schedule.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Next run:{" "}
                          {nextRun
                            ? formatScheduleDateTime(nextRun, schedule.timezone)
                            : "Not scheduled"}
                        </p>
                        <ScheduleTags
                          schedule={schedule}
                          clientName={clientName}
                          showClientTag={showClientTag}
                          className="mt-2"
                        />
                      </Link>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={isPaused ? "Resume schedule" : "Pause schedule"}
                          disabled={isBusy}
                          onClick={() => void handleToggleEnabled(schedule)}
                        >
                          {isBusy ? (
                            <Spinner className="size-3.5" />
                          ) : isPaused ? (
                            <RiPlayCircleLine className="size-4" />
                          ) : (
                            <RiPauseCircleLine className="size-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Edit ${schedule.name}`}
                          disabled={isBusy}
                          onClick={() => setEditSchedule(schedule)}
                        >
                          <RiEditLine className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="text-destructive"
                          aria-label={`Delete ${schedule.name}`}
                          disabled={isBusy}
                          onClick={() => void handleDelete(schedule)}
                        >
                          <RiDeleteBinLine className="size-4" />
                        </Button>
                        <Link
                          href={`/schedules/${schedule.id}`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          aria-label={`View runs for ${schedule.name}`}
                        >
                          <RiArrowRightSLine className="size-5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CreateScheduleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(schedule) => {
          void loadSchedules()
          router.push(`/schedules/${schedule.id}`)
        }}
      />

      <EditScheduleDialog
        schedule={editSchedule}
        open={Boolean(editSchedule)}
        onOpenChange={(open) => {
          if (!open) setEditSchedule(null)
        }}
        onUpdated={() => void loadSchedules()}
      />
    </div>
  )
}
