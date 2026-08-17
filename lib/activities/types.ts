import {
  ACTIVITY_CATEGORIES,
  DEFAULT_ACTIVITY_CATEGORY,
  type ActivityCategory,
} from "@/lib/activities/categories"

/** @deprecated Use ACTIVITY_CATEGORIES */
export const ACTIVITY_TYPES = ACTIVITY_CATEGORIES

export type ActivityType = ActivityCategory

export { ACTIVITY_CATEGORIES, DEFAULT_ACTIVITY_CATEGORY, type ActivityCategory }

export { SCHEDULE_RECURRENCE } from "@/lib/schedules/types"
export type { ScheduleRecurrence } from "@/lib/schedules/types"

/** @deprecated Use SCHEDULE_RECURRENCE */
export const ACTIVITY_RECURRENCE = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const

export type ActivityRecurrence = (typeof ACTIVITY_RECURRENCE)[number]["value"]

export type ActivityPlanStep = {
  order: number
  task: string
  details?: string
  skillId?: string
  requiresApproval?: boolean
}

export type ActivityPlanStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | string

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
  plan?: ActivityPlanStep[] | null
  planStatus?: ActivityPlanStatus | null
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
  timezone?: string
  skillIds?: string[]
  plan?: ActivityPlanStep[]
}

export type UpdateActivityRequest = {
  name?: string
  skillIds?: string[]
  plan?: ActivityPlanStep[]
}

export type CreateActivityResult =
  | { kind: "activity"; activity: ActivityRecord }
  | { kind: "schedule"; schedule: import("@/lib/schedules/types").ScheduleRecord }

export type UpdateActivityStatusRequest = {
  status: string
  reason?: string
}

export type ActivityMessage = {
  id: string
  content?: string
  text?: string
  body?: string
  role?: string
  structured?: any
  structured_?: any
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
