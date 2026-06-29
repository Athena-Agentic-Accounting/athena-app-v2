import { Badge } from "@/components/ui/badge"
import {
  formatRecurrence,
  formatScheduleType,
} from "@/lib/schedules/format-schedule"
import type { ScheduleRecord } from "@/lib/schedules/types"

type ScheduleTagsProps = {
  schedule: ScheduleRecord
  clientName?: string
  showClientTag?: boolean
  className?: string
}

export function ScheduleTags({
  schedule,
  clientName,
  showClientTag = false,
  className,
}: ScheduleTagsProps) {
  const isPaused = schedule.enabled === false

  return (
    <div className={className}>
      {schedule.timezone ? (
        <div className="mb-2">
          <Badge variant="outline" className="font-normal">
            {schedule.timezone}
          </Badge>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <Badge variant={isPaused ? "outline" : "default"}>
          {isPaused ? "Paused" : "Active"}
        </Badge>
        <Badge variant="outline" className="font-normal">
          {formatRecurrence(schedule.recurrence)}
        </Badge>
        {schedule.type ? (
          <Badge variant="outline" className="font-normal">
            {formatScheduleType(schedule.type)}
          </Badge>
        ) : null}
        {showClientTag && clientName ? (
          <Badge variant="outline" className="font-normal">
            {clientName}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
