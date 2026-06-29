import { formatActivityCategory } from "@/lib/activities/categories";
import type { ActivityRecord } from "@/lib/activities/types";
import type { ChecklistTask, TaskStatus } from "@/lib/checklist/mock-tasks";

const STATUS_MAP: Record<string, TaskStatus> = {
  draft: "to-do",
  plan_pending: "in-review",
  plan_approved: "in-review",
  scheduled: "to-do",
  executing: "needs-action",
  awaiting_input: "needs-action",
  completed: "complete",
  rejected: "needs-action",
  to_do: "to-do",
  in_progress: "needs-action",
  needs_attention: "needs-action",
  in_review: "in-review",
};

function formatStartDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function mapActivityStatus(status?: string): TaskStatus {
  if (!status) return "to-do";
  return STATUS_MAP[status] ?? "to-do";
}

export function mapActivityToChecklistTask(
  activity: ActivityRecord,
  options?: { clientName?: string },
): ChecklistTask {
  return {
    id: activity.id,
    title: activity.name,
    status: mapActivityStatus(activity.status),
    category: formatActivityCategory(activity.type),
    dueDate: formatStartDate(activity.startDate ?? undefined),
    assignees: [],
    clientId: activity.clientId,
    clientName: options?.clientName,
  };
}
