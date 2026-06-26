"use client"

import { useRouter } from "next/navigation"

import { SessionWorkspaceView } from "@/components/session/session-workspace-view"
import { Spinner } from "@/components/ui/spinner"
import { useActivitySession } from "@/hooks/use-activity-session"

type ActivitySessionViewProps = {
  activityId: string
  initialPrompt?: string | null
}

export function ActivitySessionView({ activityId, initialPrompt }: ActivitySessionViewProps) {
  const router = useRouter()
  const session = useActivitySession(activityId, initialPrompt)

  if (session.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <SessionWorkspaceView
      activityId={activityId}
      activityName={session.activity?.name}
      artifact={session.artifact}
      thoughts={session.thoughts}
      streamEvents={session.streamEvents}
      chatMessages={session.messages}
      showPlanAction={Boolean(session.artifact)}
      streamStatus={session.streamStatus}
      isSending={session.isSending}
      onSendMessage={session.sendMessage}
      onPlanDecision={session.handlePlanDecision}
      onApprovalDecision={session.handleApprovalDecision}
      onClose={() => router.push("/home")}
    />
  )
}
