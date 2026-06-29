export type TaskStatus = "needs-action" | "to-do" | "in-review" | "complete"

export type ChecklistTask = {
  id: string
  title: string
  status: TaskStatus
  category: string
  dueDate: string
  assignees: string[]
  clientId?: string
  clientName?: string
}

export const CHECKLIST_COLUMNS: {
  id: TaskStatus
  label: string
}[] = [
  { id: "needs-action", label: "Needs action" },
  { id: "to-do", label: "To do" },
  { id: "in-review", label: "In review" },
  { id: "complete", label: "Complete" },
]

export const MOCK_CHECKLIST_TASKS: ChecklistTask[] = [
  {
    id: "1",
    title: "AP Reconciliation / Aging",
    status: "needs-action",
    category: "Payables & Payroll",
    dueDate: "May 1",
    assignees: ["SC", "MR"],
  },
  {
    id: "2",
    title: "Bank Reconciliation",
    status: "needs-action",
    category: "Cash & Treasury",
    dueDate: "May 1",
    assignees: ["SC"],
  },
  {
    id: "3",
    title: "Revenue Recognition Review",
    status: "to-do",
    category: "Reporting & Analysis",
    dueDate: "May 3",
    assignees: ["MR", "JL"],
  },
  {
    id: "4",
    title: "Payroll Accrual Entries",
    status: "to-do",
    category: "Payables & Payroll",
    dueDate: "May 4",
    assignees: ["SC"],
  },
  {
    id: "5",
    title: "Fixed Asset Depreciation",
    status: "in-review",
    category: "Reporting & Analysis",
    dueDate: "May 2",
    assignees: ["MR"],
  },
  {
    id: "6",
    title: "Intercompany Eliminations",
    status: "in-review",
    category: "Reporting & Analysis",
    dueDate: "May 5",
    assignees: ["JL", "SC"],
  },
  {
    id: "7",
    title: "Trial Balance Review",
    status: "complete",
    category: "Reporting & Analysis",
    dueDate: "Apr 28",
    assignees: ["MR"],
  },
]

export function getTasksByStatus(status: TaskStatus): ChecklistTask[] {
  return MOCK_CHECKLIST_TASKS.filter((task) => task.status === status)
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  "needs-action": "Needs action",
  "to-do": "To do",
  "in-review": "In review",
  complete: "Complete",
}
