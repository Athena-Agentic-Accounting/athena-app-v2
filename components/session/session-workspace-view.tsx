"use client"

import { useEffect, useState } from "react"

import { ArtifactPanel } from "@/components/session/artifact-panel"
import { ChatSessionPanel } from "@/components/session/chat-session-panel"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ActivityStreamEvent, PlanReviewDecision } from "@/lib/genui/types"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import type { SessionArtifact, SessionThought, SessionUserMessage } from "@/lib/session/types"
import { cn } from "@/lib/utils"

type SessionWorkspaceViewProps = {
  activityId: string
  activityName?: string
  userMessage?: SessionUserMessage
  thoughts?: SessionThought[]
  streamEvents: ActivityStreamEvent[]
  chatMessages?: SessionChatMessage[]
  artifact?: SessionArtifact
  showPlanAction?: boolean
  streamStatus?: UseActivitySessionReturn["streamStatus"]
  sessionError?: UseActivitySessionReturn["sessionError"]
  onRetrySession?: UseActivitySessionReturn["retrySession"]
  isSending?: boolean
  isAwaitingResponse?: boolean
  onSendMessage?: (content: string) => Promise<void>
  onPlanDecision?: (decision: PlanReviewDecision, gateId?: string) => void | Promise<void>
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
  onEditActivity?: () => void
  activityLocked?: boolean
  activityStatus?: string
  onStatusChange?: () => void | Promise<void>
  onClose?: () => void
  className?: string
}

export function SessionWorkspaceView({
  activityId,
  activityName,
  userMessage,
  thoughts = [],
  streamEvents,
  chatMessages,
  artifact,
  showPlanAction = false,
  streamStatus,
  sessionError,
  onRetrySession,
  isSending,
  isAwaitingResponse,
  onSendMessage,
  onPlanDecision,
  onApprovalDecision,
  onEditActivity,
  activityLocked = false,
  activityStatus,
  onStatusChange,
  onClose,
  className,
}: SessionWorkspaceViewProps) {
  const planTabId = artifact?.planTabId ?? "plan"
  const [showArtifact, setShowArtifact] = useState(Boolean(artifact))
  const [activeTabId, setActiveTabId] = useState(artifact?.activeTabId)

  useEffect(() => {
    if (artifact) setShowArtifact(true)
  }, [artifact])

  return (
    <div className={cn("flex h-full min-h-0 overflow-hidden", className)}>
      {showArtifact && artifact ? (
        <ArtifactPanel
          artifact={artifact}
          activeTabId={activeTabId}
          activityStatus={activityStatus}
          onActiveTabChange={setActiveTabId}
          onPlanDecision={onPlanDecision}
        />
      ) : null}

      <ChatSessionPanel
        activityId={activityId}
        activityName={activityName}
        userMessage={userMessage}
        thoughts={thoughts}
        streamEvents={streamEvents}
        chatMessages={chatMessages}
        showPlanAction={showPlanAction}
        streamStatus={streamStatus}
        sessionError={sessionError}
        onRetrySession={onRetrySession}
        isSending={isSending}
        isAwaitingResponse={isAwaitingResponse}
        onSendMessage={onSendMessage}
        onPlanDecision={onPlanDecision}
        onApprovalDecision={onApprovalDecision}
        onEditActivity={onEditActivity}
        activityLocked={activityLocked}
        activityStatus={activityStatus}
        onStatusChange={onStatusChange}
        onViewPlan={() => {
          setShowArtifact(true)
          setActiveTabId(planTabId)
        }}
        onClose={onClose}
        className={
          showArtifact && artifact
            ? "w-[min(100%,26rem)] shrink-0 border-l border-border"
            : "border-l-0"
        }
      />
    </div>
  )
}
