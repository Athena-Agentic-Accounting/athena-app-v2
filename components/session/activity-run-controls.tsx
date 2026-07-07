"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiPauseLine, RiPlayLine, RiStopLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { updateActivityStatus } from "@/lib/api/activities"

type ActivityRunControlsProps = {
  activityId: string
  activityStatus?: string
  onStatusChange?: () => void | Promise<void>
}

/**
 * Manual run controls mapping onto the engine's transition matrix:
 * pause = executing → awaiting_input, resume = awaiting_input → executing,
 * stop = executing → completed (engine records controlState "cancelled" and
 * audit-locks the activity). The AI honors pause/cancel between plan steps.
 */
export function ActivityRunControls({
  activityId,
  activityStatus,
  onStatusChange,
}: ActivityRunControlsProps) {
  const { getToken } = useAuth()
  const [pending, setPending] = useState<string | null>(null)

  async function transition(status: string, reason: string, label: string) {
    setPending(status)
    try {
      const token = await getToken()
      await updateActivityStatus(token, activityId, { status, reason })
      toast.success(label)
      await onStatusChange?.()
    } catch (err) {
      toast.error("Could not update the task", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setPending(null)
    }
  }

  if (activityStatus === "executing") {
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2.5 text-xs font-normal"
          disabled={pending !== null}
          onClick={() =>
            void transition("awaiting_input", "Paused by user", "Task paused")
          }
        >
          {pending === "awaiting_input" ? (
            <Spinner className="size-3" />
          ) : (
            <RiPauseLine className="size-3.5" />
          )}
          Pause
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2.5 text-xs font-normal text-destructive"
          disabled={pending !== null}
          onClick={() => {
            if (
              !window.confirm(
                "Stop this task? It will be marked complete and locked — this cannot be undone.",
              )
            ) {
              return
            }
            void transition("completed", "Cancelled by user", "Task stopped")
          }}
        >
          {pending === "completed" ? (
            <Spinner className="size-3" />
          ) : (
            <RiStopLine className="size-3.5" />
          )}
          Stop
        </Button>
      </div>
    )
  }

  if (activityStatus === "awaiting_input") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2.5 text-xs font-normal"
        disabled={pending !== null}
        onClick={() => void transition("executing", "Resumed by user", "Task resumed")}
      >
        {pending === "executing" ? (
          <Spinner className="size-3" />
        ) : (
          <RiPlayLine className="size-3.5" />
        )}
        Resume
      </Button>
    )
  }

  return null
}
