import type { AthenaUnsafeMetadata } from "@/lib/athena/user-metadata"
import { getPrimaryClientName } from "@/lib/athena/user-metadata"
import {
  MOCK_CHECKLIST_TASKS,
  type ChecklistTask,
} from "@/lib/checklist/mock-tasks"

export const WELCOME_CHECK_TASK_ID = "welcome-check"

export function createWelcomeCheckTask(clientName: string): ChecklistTask {
  return {
    id: WELCOME_CHECK_TASK_ID,
    title: `Welcome Check — ${clientName}`,
    status: "to-do",
    category: "Getting started",
    dueDate: "Today",
    assignees: ["AI"],
  }
}

export type BoardViewState = "welcome-check" | "post-welcome" | "demo"

export function getBoardViewState(meta?: AthenaUnsafeMetadata): BoardViewState {
  if (!meta?.onboardingComplete) return "demo"

  if (meta.institution?.welcomeCheckCompleted) {
    return "post-welcome"
  }

  if (meta.onboardingJustCompleted || meta.institution?.integrations?.quickbooks) {
    return "welcome-check"
  }

  return "demo"
}

export function getBoardTasks(meta?: AthenaUnsafeMetadata): ChecklistTask[] {
  const viewState = getBoardViewState(meta)

  if (viewState === "welcome-check") {
    return [createWelcomeCheckTask(getPrimaryClientName(meta))]
  }

  if (viewState === "post-welcome") {
    return EMPTY_BOARD_TASKS
  }

  return MOCK_CHECKLIST_TASKS
}

const EMPTY_BOARD_TASKS: ChecklistTask[] = []

export function getTasksByStatusFromList(
  tasks: ChecklistTask[],
  status: ChecklistTask["status"],
): ChecklistTask[] {
  return tasks.filter((task) => task.status === status)
}

export function getBoardCounts(tasks: ChecklistTask[]) {
  return {
    assignedCount: tasks.length > 0 ? Math.min(tasks.length, 1) : 0,
    allCount: tasks.length,
  }
}
