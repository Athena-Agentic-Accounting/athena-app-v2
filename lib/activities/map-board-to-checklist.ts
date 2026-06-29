import type { ActivityBoardResponse, BoardActivity } from "@/lib/activities/board-types"
import { getBoardColumns } from "@/lib/activities/board-types"
import { formatActivityCategory } from "@/lib/activities/categories"
import { mapActivityStatus } from "@/lib/activities/map-to-board-task"
import type { ChecklistTask } from "@/lib/checklist/mock-tasks"

function getAssigneeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function formatDueDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function mapBoardActivityToChecklistTask(
  activity: BoardActivity,
  columnStatus?: string,
): ChecklistTask {
  const status = mapActivityStatus(activity.status ?? columnStatus)

  return {
    id: activity.id,
    title: activity.name,
    status,
    category: formatActivityCategory(activity.type),
    dueDate: formatDueDate(activity.dueDate ?? activity.startDate),
    assignees: activity.assignedTo?.name
      ? [getAssigneeInitials(activity.assignedTo.name)]
      : [],
    clientId: activity.clientId,
    clientName: activity.clientName,
  }
}

export function mapBoardToChecklistTasks(board: ActivityBoardResponse): ChecklistTask[] {
  const columns = getBoardColumns(board)
  const tasks: ChecklistTask[] = []

  for (const [columnStatus, activities] of Object.entries(columns)) {
    for (const activity of activities ?? []) {
      tasks.push(mapBoardActivityToChecklistTask(activity, columnStatus))
    }
  }

  return tasks
}

export function getBoardTotalCount(board: ActivityBoardResponse): number {
  if (board.counts) {
    return Object.values(board.counts).reduce<number>(
      (sum, count) => sum + (count ?? 0),
      0,
    )
  }

  return mapBoardToChecklistTasks(board).length
}

export function getBoardAssignedCount(tasks: ChecklistTask[]): number {
  return tasks.filter((task) => task.assignees.length > 0).length
}

export function getBoardCountsFromTasks(tasks: ChecklistTask[]) {
  return {
    allCount: tasks.length,
    assignedCount: getBoardAssignedCount(tasks),
  }
}
