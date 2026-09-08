"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { ActivitySessionView } from "@/components/session/activity-session-view"
import { SessionWorkspaceView } from "@/components/session/session-workspace-view"
import { Spinner } from "@/components/ui/spinner"
import { FIXED_ASSETS_SESSION } from "@/lib/session/mock-fixed-assets-session"

function DemoSessionContent() {
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activityId")
  const prompt = searchParams.get("prompt")

  if (activityId) {
    return <ActivitySessionView activityId={activityId} initialPrompt={prompt} />
  }

  return (
    <SessionWorkspaceView
      activityId={FIXED_ASSETS_SESSION.activityId}
      userMessage={FIXED_ASSETS_SESSION.userMessage}
      thoughts={FIXED_ASSETS_SESSION.thoughts}
      streamEvents={FIXED_ASSETS_SESSION.streamEvents}
      artifact={FIXED_ASSETS_SESSION.artifact}
      onPlanDecision={FIXED_ASSETS_SESSION.onPlanDecision}
    />
  )
}

export function DemoSessionView() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-background">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      }
    >
      <DemoSessionContent />
    </Suspense>
  )
}
