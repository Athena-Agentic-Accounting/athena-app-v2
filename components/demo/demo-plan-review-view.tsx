"use client"

import { SessionWorkspaceView } from "@/components/session/session-workspace-view"
import { PLAN_REVIEW_SESSION } from "@/lib/session/mock-plan-review-session"

export function DemoPlanReviewView() {
  return (
    <SessionWorkspaceView
      activityId={PLAN_REVIEW_SESSION.activityId}
      userMessage={PLAN_REVIEW_SESSION.userMessage}
      thoughts={PLAN_REVIEW_SESSION.thoughts}
      streamEvents={PLAN_REVIEW_SESSION.streamEvents}
      artifact={PLAN_REVIEW_SESSION.artifact}
      showPlanAction={PLAN_REVIEW_SESSION.showPlanAction}
      onPlanDecision={PLAN_REVIEW_SESSION.onPlanDecision}
    />
  )
}
