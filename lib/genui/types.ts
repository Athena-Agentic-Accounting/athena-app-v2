export type CardType =
  | "progress"
  | "narrative"
  | "table"
  | "journal_entry_review"
  | "checklist"
  | "chart"
  | "file_created"
  | "attention_required"
  | "approval_gate"
  | "question_choice"

export type ProgressCardData = {
  stepDescription: string
  stepIndex?: number
  percent?: number
  title?: string
}

export type NarrativeCardData = {
  markdown: string
  title?: string
}

export type TableColumnDef = {
  key: string
  label: string
  align?: "left" | "right"
  format?: "text" | "currency" | "accounting"
}

export type TableCardData = {
  columns: TableColumnDef[]
  rows: Record<string, unknown>[]
  title?: string
}

export type PlanReviewDecision = "save" | "reject" | "schedule" | "start_now"

export type JournalEntryLine = {
  account: string
  description?: string
  debit?: number
  credit?: number
}

export type JournalEntryReviewData = {
  date: string
  lines: JournalEntryLine[]
  memo?: string
  title?: string
  reversing?: boolean
  reversalDate?: string
}

export type ChecklistCardData = {
  items: { label: string; done: boolean; detail?: string }[]
  title?: string
}

export type ChartCardData = {
  chartType: "bar" | "line" | "pie"
  labels: string[]
  series: { name: string; values: number[] }[]
  title?: string
}

export type FileCreatedCardData = {
  fileName: string
  fileUrl: string
  mimeType?: string
  location?: string
  title?: string
}

export type AttentionCardData = {
  reason: string
  detail?: string
  title?: string
}

export type ApprovalGateCardData = {
  gateId?: string
  gateType: string
  title: string
  payload: Record<string, unknown>
  pendingAction: { target: string; args: Record<string, unknown> }
  stepIndex?: number
  status?: string
}

export type QuestionChoiceOption = {
  id: string
  label: string
}

export type QuestionChoiceCardData = {
  question: string
  description?: string
  options: QuestionChoiceOption[]
  stepIndex?: number
  stepCount?: number
  allowSkip?: boolean
  skipLabel?: string
  selectedOptionId?: string
}

export type ApprovalDecision = "approve" | "reject" | "edit"

export type ApprovalDecisionRecord = {
  decision: ApprovalDecision
  decidedBy?: string
  decidedAt?: string
  notes?: string
}

export type CardEventPayload =
  | { type: "progress"; data: ProgressCardData }
  | { type: "narrative"; data: NarrativeCardData }
  | { type: "table"; data: TableCardData }
  | { type: "journal_entry_review"; data: JournalEntryReviewData }
  | { type: "checklist"; data: ChecklistCardData }
  | { type: "chart"; data: ChartCardData }
  | { type: "file_created"; data: FileCreatedCardData }
  | { type: "attention_required"; data: AttentionCardData }
  | { type: "approval_gate"; data: ApprovalGateCardData }
  | { type: "question_choice"; data: QuestionChoiceCardData }

export type ActivityStreamEvent = {
  id: string
  activityId: string
  timestamp?: string
  event: CardEventPayload
}

export type CardRendererOptions = {
  activityId?: string
  isLive?: boolean
  canDecide?: boolean
  decision?: ApprovalDecisionRecord
  isPlanConfirmed?: boolean
  onPlanDecision?: (decision: PlanReviewDecision) => void | Promise<void>
  onDecision?: (
    gateId: string,
    payload: {
      decision: ApprovalDecision
      notes?: string
      editedPayload?: Record<string, unknown>
    },
  ) => Promise<void> | void
  questionChoice?: {
    selectedOptionId?: string
    onSelect?: (optionId: string) => void
    onSkip?: () => void
    onStepChange?: (direction: "prev" | "next") => void
  }
}
