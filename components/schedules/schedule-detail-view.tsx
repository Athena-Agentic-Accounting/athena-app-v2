"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  RiArrowLeftLine,
  RiCalendarScheduleLine,
  RiChat1Line,
  RiDeleteBinLine,
  RiEditLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { EditScheduleDialog } from "@/components/schedules/edit-schedule-dialog"
import { ScheduleTags } from "@/components/schedules/schedule-tags"
import { useClient } from "@/components/providers/client-provider"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteSchedule,
  getSchedule,
  listScheduleRuns,
  resolveScheduleRunActivityId,
  updateSchedule,
} from "@/lib/api/schedules"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import {
  formatScheduleDateTime,
  getScheduleClientId,
  getScheduleClientName,
  getScheduleLastRunAt,
  getScheduleNextRunAt,
  getScheduleStartDate,
} from "@/lib/schedules/format-schedule"
import type { ScheduleRecord, ScheduleRun } from "@/lib/schedules/types"

type ScheduleDetailViewProps = {
  scheduleId: string
}

export function ScheduleDetailView({ scheduleId }: ScheduleDetailViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { clients, selectedClientId } = useClient()
  const [schedule, setSchedule] = useState<ScheduleRecord | null>(null)
  const [runs, setRuns] = useState<ScheduleRun[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      if (client.id !== ALL_CLIENTS_ID) map.set(client.id, client.name)
    }
    return map
  }, [clients])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const [record, runItems] = await Promise.all([
        getSchedule(token, scheduleId),
        listScheduleRuns(token, scheduleId),
      ])
      setSchedule(record)
      setRuns(runItems)
    } catch (err) {
      setSchedule(null)
      setRuns([])
      toast.error("Could not load schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, scheduleId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleToggleEnabled() {
    if (!schedule) return
    setBusy(true)
    try {
      const token = await getToken()
      const updated = await updateSchedule(token, schedule.id, {
        enabled: schedule.enabled === false,
      })
      setSchedule(updated)
      toast.success(updated.enabled === false ? "Schedule paused" : "Schedule resumed")
    } catch (err) {
      toast.error("Could not update schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!schedule) return
    if (!window.confirm(`Delete schedule "${schedule.name}"?`)) return

    setBusy(true)
    try {
      const token = await getToken()
      await deleteSchedule(token, schedule.id)
      toast.success("Schedule deleted")
      router.push("/schedules")
    } catch (err) {
      toast.error("Could not delete schedule", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <PageHeader
          title="Schedules"
          icon={RiCalendarScheduleLine}
          showSearch={false}
          breadcrumbs={[{ label: "Schedules", href: "/schedules" }, { label: "Loading…" }]}
        />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <PageHeader
          title="Schedules"
          icon={RiCalendarScheduleLine}
          showSearch={false}
          breadcrumbs={[{ label: "Schedules", href: "/schedules" }, { label: "Not found" }]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">This schedule could not be found.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedules">
              <RiArrowLeftLine className="size-3.5" />
              Back to schedules
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const clientName =
    getScheduleClientName(schedule) ?? clientNameById.get(getScheduleClientId(schedule))
  const isPaused = schedule.enabled === false

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={schedule.name}
        description={formatScheduleDateTime(getScheduleNextRunAt(schedule), schedule.timezone)}
        icon={RiCalendarScheduleLine}
        showSearch={false}
        breadcrumbs={[
          { label: "Schedules", href: "/schedules" },
          { label: schedule.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/schedules">
                <RiArrowLeftLine className="size-3.5" />
                Back
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void handleToggleEnabled()}
            >
              {isPaused ? (
                <>
                  <RiPlayCircleLine className="size-3.5" />
                  Resume
                </>
              ) : (
                <>
                  <RiPauseCircleLine className="size-3.5" />
                  Pause
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setEditOpen(true)}
            >
              <RiEditLine className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={busy}
              onClick={() => void handleDelete()}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        <div className="flex w-full flex-col gap-6">
          <section className="rounded-xl border border-border/70 bg-card p-4 ring-1 ring-foreground/5">
            <ScheduleTags
              schedule={schedule}
              clientName={clientName}
              showClientTag={selectedClientId === ALL_CLIENTS_ID}
            />

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Start</dt>
                <dd className="mt-0.5 text-foreground">
                  {formatScheduleDateTime(getScheduleStartDate(schedule), schedule.timezone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Next run</dt>
                <dd className="mt-0.5 text-foreground">
                  {formatScheduleDateTime(getScheduleNextRunAt(schedule), schedule.timezone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last run</dt>
                <dd className="mt-0.5 text-foreground">
                  {formatScheduleDateTime(getScheduleLastRunAt(schedule), schedule.timezone)}
                </dd>
              </div>
              {schedule.cronExpression ?? schedule.cron_expression ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Cron</dt>
                  <dd className="mt-0.5 font-mono text-xs text-foreground">
                    {schedule.cronExpression ?? schedule.cron_expression}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-medium text-foreground">Run history</h2>
              <p className="text-sm text-muted-foreground">
                Activities spawned when this schedule fired.
              </p>
            </div>

            {runs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 py-12 text-center text-sm text-muted-foreground">
                No runs yet. The first activity will appear here after the schedule fires.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5">
                {runs.map((run, index) => {
                  const activityId = resolveScheduleRunActivityId(run)
                  const label = run.name ?? `Run ${run.id.slice(0, 8)}`

                  return (
                    <article key={run.id}>
                      {index > 0 ? <div className="border-t border-border/60" /> : null}
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatScheduleDateTime(
                              run.startedAt ?? run.started_at ?? run.createdAt ?? run.created_at,
                              schedule.timezone,
                            )}
                            {run.status ? ` · ${run.status}` : ""}
                          </p>
                        </div>
                        {activityId ? (
                          <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={`/activities/${activityId}`}>
                              <RiChat1Line className="size-3.5" />
                              Open activity
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <EditScheduleDialog
        schedule={schedule}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={(updated) => {
          setSchedule(updated)
          void load()
        }}
      />
    </div>
  )
}
