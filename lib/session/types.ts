import type { ActivityStreamEvent, PlanReviewDecision, TableCardData } from "@/lib/genui/types"

export type SessionDocumentTab = {
  kind: "document"
  id: string
  slug: string
  title: string
  description?: string
  markdown: string
}

export type SessionPlanReviewTab = {
  kind: "plan_review"
  id: string
  slug: string
  title: string
  gateId?: string
  markdown: string
  table?: TableCardData
}

export type SessionArtifactTab = SessionDocumentTab | SessionPlanReviewTab

export type SessionArtifact = {
  tabs: SessionArtifactTab[]
  activeTabId: string
  planTabId?: string
}

export type SessionUserMessage = {
  title?: string
  body: string
}

export type SessionThought = {
  id: string
  text: string
}

/** Split workspace shown while an activity chat is in session. */
export type SessionWorkspaceState = {
  activityId: string
  userMessage: SessionUserMessage
  thoughts: SessionThought[]
  streamEvents: ActivityStreamEvent[]
  artifact?: SessionArtifact
  showPlanAction?: boolean
  onPlanDecision?: (decision: PlanReviewDecision, gateId?: string) => void | Promise<void>
}
