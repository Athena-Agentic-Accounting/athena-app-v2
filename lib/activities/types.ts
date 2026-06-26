export const ACTIVITY_TYPES = [
  { value: "reconciliation", label: "Reconciliation" },
  { value: "close_task", label: "Close task" },
  { value: "reporting", label: "Reporting" },
  { value: "analysis", label: "Analysis" },
] as const

export const ACTIVITY_RECURRENCE = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"]
export type ActivityRecurrence = (typeof ACTIVITY_RECURRENCE)[number]["value"]

export type ActivityRecord = {
  id: string
  name: string
  clientId: string
  organizationId?: string
  status?: string
  type?: string
  recurrence?: string | null
  startDate?: string | null
  sessionId?: string
  auditTrailId?: string
  plan?: unknown | null
  planStatus?: string
  planConfirmedBy?: string | null
  planConfirmedAt?: string | null
  currentStepIndex?: number | null
  skillIds?: string[] | null
  auditLockedAt?: string | null
  sourcePrompt?: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateActivityRequest = {
  clientId: string
  name: string
  type?: string
  recurrence?: string
  startDate?: string
  skillIds?: string[]
}

export type UpdateActivityStatusRequest = {
  status: string
  reason?: string
}

export type ActivityMessage = {
  id: string
  content: string
  role?: string
  createdAt?: string
  created_at?: string
}

export type ActivityPromptResponse = {
  kind: string
  activity?: ActivityRecord
  answer?: string
  message?: string
  content?: string
}
