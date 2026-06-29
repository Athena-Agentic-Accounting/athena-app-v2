import type { TaskStatus } from "@/lib/checklist/mock-tasks"

export const ACTIVITY_COLUMN_STATUS: Record<TaskStatus, string> = {
  "needs-action": "awaiting_input",
  "to-do": "draft",
  "in-review": "plan_pending",
  complete: "completed",
}

export function activityStatusForTaskStatus(status: TaskStatus): string {
  return ACTIVITY_COLUMN_STATUS[status]
}
