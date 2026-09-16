"use client"

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react"

import { ArtifactPanel } from "@/components/session/artifact-panel"
import { ChatSessionPanel } from "@/components/session/chat-session-panel"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ActivityStreamEvent, PlanReviewDecision } from "@/lib/genui/types"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import { buildSessionOutputItems, type SessionOutputItem } from "@/lib/session/output-items"
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
  streamStatus?: UseActivitySessionReturn["streamStatus"]
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
  activeOutputId?: string
  onActiveOutputChange?: (id: string) => void
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
  streamStatus,
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
  activeOutputId: controlledActiveOutputId,
  onActiveOutputChange,
  className,
}: SessionWorkspaceViewProps) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const outputs = useMemo(
    () => buildSessionOutputItems(artifact, streamEvents),
    [artifact, streamEvents],
  )
  const [selectedOutputId, setSelectedOutputId] = useState<string>()
  const [mobileOutputOpen, setMobileOutputOpen] = useState(false)
  const [desktopOutputOpen, setDesktopOutputOpen] = useState(true)
  const [outputWidth, setOutputWidth] = useState(62)
  const [isResizing, setIsResizing] = useState(false)

  const activeOutputId = useMemo(() => {
    if (
      controlledActiveOutputId &&
      outputs.some((output) => output.id === controlledActiveOutputId)
    ) {
      return controlledActiveOutputId
    }
    if (
      selectedOutputId &&
      outputs.some((output) => output.id === selectedOutputId)
    ) {
      return selectedOutputId
    }
    return outputs.at(-1)?.id
  }, [controlledActiveOutputId, selectedOutputId, outputs])

  const handleSelectOutput = useCallback(
    (outputId: string) => {
      setSelectedOutputId(outputId)
      onActiveOutputChange?.(outputId)
    },
    [onActiveOutputChange],
  )

  // The session hook points activeOutputId at approval gates, new files and the
  // plan review as they arrive; bring the output panel into view when it does
  // (on mobile, only if that won't pull the user out of the composer).
  const controlledTarget = controlledActiveOutputId
    ? outputs.find((output) => output.id === controlledActiveOutputId)
    : undefined
  const [revealedOutputId, setRevealedOutputId] = useState<string>()
  if (
    controlledTarget &&
    controlledTarget.id !== revealedOutputId &&
    isActionableOutput(controlledTarget)
  ) {
    setRevealedOutputId(controlledTarget.id)
    setDesktopOutputOpen(true)
    if (!isUserTyping()) setMobileOutputOpen(true)
  }

  function clampOutputWidth(nextWidth: number) {
    const bounds = workspaceRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) {
      return Math.min(75, Math.max(35, nextWidth))
    }

    const minimumPaneWidth = 288
    const dividerWidth = 8
    const minimumPercent = Math.max(30, (minimumPaneWidth / bounds.width) * 100)
    const maximumPercent = Math.min(
      75,
      ((bounds.width - minimumPaneWidth - dividerWidth) / bounds.width) * 100,
    )

    return Math.min(maximumPercent, Math.max(minimumPercent, nextWidth))
  }

  function resizeOutput(clientX: number) {
    const bounds = workspaceRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return

    const nextWidth = ((clientX - bounds.left) / bounds.width) * 100
    setOutputWidth(clampOutputWidth(nextWidth))
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      setOutputWidth((current) =>
        clampOutputWidth(current + (event.key === "ArrowLeft" ? -2 : 2)),
      )
    } else if (event.key === "Home") {
      event.preventDefault()
      setOutputWidth(clampOutputWidth(Number.NEGATIVE_INFINITY))
    } else if (event.key === "End") {
      event.preventDefault()
      setOutputWidth(clampOutputWidth(Number.POSITIVE_INFINITY))
    }
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsResizing(true)
    resizeOutput(event.clientX)
  }

  function handleResizePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    resizeOutput(event.clientX)
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsResizing(false)
  }

  return (
    <div
      ref={workspaceRef}
      className={cn(
        "relative flex h-full min-h-0 overflow-hidden",
        isResizing && "select-none cursor-col-resize",
        className,
      )}
      style={{ "--workpaper-width": `${outputWidth}%` } as CSSProperties}
    >
      {outputs.length > 0 && desktopOutputOpen ? (
        <div
          id="session-workpaper-panel"
          className={cn(
            "min-w-0 flex-none md:w-[var(--workpaper-width)]",
            mobileOutputOpen ? "flex w-full" : "hidden md:flex",
          )}
        >
          <ArtifactPanel
            outputs={outputs}
            streamEvents={streamEvents}
            activeOutputId={activeOutputId}
            onActiveOutputChange={handleSelectOutput}
            onPlanDecision={onPlanDecision}
            onApprovalDecision={onApprovalDecision}
            onBackToConversation={() => setMobileOutputOpen(false)}
            onCloseWorkpaper={() => setDesktopOutputOpen(false)}
          />
        </div>
      ) : null}

      {outputs.length > 0 && desktopOutputOpen ? (
        <div
          role="separator"
          aria-label="Resize workpaper and conversation"
          aria-controls="session-workpaper-panel session-conversation-panel"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={75}
          aria-valuenow={Math.round(outputWidth)}
          tabIndex={0}
          className="group relative z-10 hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none md:flex"
          onDoubleClick={() => setOutputWidth(62)}
          onKeyDown={handleResizeKeyDown}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        >
          <span className="h-full w-px bg-border transition-[width,background-color] duration-150 group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary" />
        </div>
      ) : null}

      <ChatSessionPanel
        activityId={activityId}
        activityName={activityName}
        userMessage={userMessage}
        thoughts={thoughts}
        streamEvents={streamEvents}
        chatMessages={chatMessages}
        outputs={outputs}
        streamStatus={streamStatus}
        isSending={isSending}
        isAwaitingResponse={isAwaitingResponse}
        onSendMessage={onSendMessage}
        onOpenOutputs={
          outputs.length > 0 && !desktopOutputOpen
            ? () => setDesktopOutputOpen(true)
            : undefined
        }
        onEditActivity={onEditActivity}
        activityLocked={activityLocked}
        activityStatus={activityStatus}
        onStatusChange={onStatusChange}
        onClose={onClose}
        className={cn(
          "w-full border-l-0",
          mobileOutputOpen && outputs.length > 0 && desktopOutputOpen
            ? "hidden md:flex"
            : "flex",
        )}
      />
    </div>
  )
}

function isUserTyping(): boolean {
  if (typeof document === "undefined") return false
  const tag = document.activeElement?.tagName
  return tag === "TEXTAREA" || tag === "INPUT"
}

function isActionableOutput(output: SessionOutputItem): boolean {
  if (output.source === "artifact") return output.tab.kind === "plan_review"
  return output.event.event.type === "approval_gate" || output.event.event.type === "file_created"
}
