export const SCHEDULE_RECURRENCE = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const

export type ScheduleRecurrence = (typeof SCHEDULE_RECURRENCE)[number]["value"]

export type ScheduleRecord = {
  id: string
  clientId?: string
  client_id?: string
  clientName?: string
  client_name?: string
  name: string
  type?: string
  recurrence?: ScheduleRecurrence | string
  startDate?: string | null
  start_date?: string | null
  timezone?: string
  cronExpression?: string
  cron_expression?: string
  nextRunAt?: string | null
  next_run_at?: string | null
  lastRunAt?: string | null
  last_run_at?: string | null
  enabled?: boolean
  skillIds?: string[]
  skill_ids?: string[]
  plan?: unknown
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export type ScheduleRun = {
  id: string
  activityId?: string
  activity_id?: string
  scheduleId?: string
  schedule_id?: string
  status?: string
  name?: string
  startedAt?: string | null
  started_at?: string | null
  completedAt?: string | null
  completed_at?: string | null
  createdAt?: string
  created_at?: string
}

export type CreateScheduleRequest = {
  clientId: string
  name: string
  startDate: string
  recurrence?: ScheduleRecurrence
  timezone?: string
  type?: string
  skillIds?: string[]
  plan?: unknown
}

export type UpdateScheduleRequest = {
  name?: string
  type?: string
  skillIds?: string[]
  plan?: unknown
  recurrence?: ScheduleRecurrence
  startDate?: string
  timezone?: string
  enabled?: boolean
}
