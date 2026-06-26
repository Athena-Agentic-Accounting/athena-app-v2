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
  isSending?: boolean
  onSendMessage?: (content: string) => Promise<void>
  onPlanDecision?: (decision: PlanReviewDecision, gateId?: string) => void | Promise<void>
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
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
  isSending,
  onSendMessage,
  onPlanDecision,
  onApprovalDecision,
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
        isSending={isSending}
        onSendMessage={onSendMessage}
        onApprovalDecision={onApprovalDecision}
        onViewPlan={() => {
          setShowArtifact(true)
          setActiveTabId(planTabId)
        }}
        onClose={onClose}
        className={showArtifact && artifact ? undefined : "w-full max-w-none border-l-0"}
      />
    </div>
  )
}
