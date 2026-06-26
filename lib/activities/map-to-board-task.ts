import type { ActivityRecord } from "@/lib/activities/types"
import { formatActivityType } from "@/lib/activities/format-activity-type"
import type { ChecklistTask, TaskStatus } from "@/lib/checklist/mock-tasks"

const STATUS_MAP: Record<string, TaskStatus> = {
  to_do: "to-do",
  in_progress: "needs-action",
  needs_attention: "needs-action",
  in_review: "in-review",
  completed: "complete",
}

function formatStartDate(value?: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function mapActivityStatus(status?: string): TaskStatus {
  if (!status) return "to-do"
  return STATUS_MAP[status] ?? "to-do"
}

export function mapActivityToChecklistTask(activity: ActivityRecord): ChecklistTask {
  return {
    id: activity.id,
    title: activity.name,
    status: mapActivityStatus(activity.status),
    category: formatActivityType(activity.type),
    dueDate: formatStartDate(activity.startDate ?? undefined),
    assignees: [],
  }
}
