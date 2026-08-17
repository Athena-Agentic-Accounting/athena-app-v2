"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { RiCloseLine, RiEditLine, RiFileLine, RiLinkM } from "@remixicon/react"
import { toast } from "sonner"

import { ChatMessageBubble } from "@/components/chat/chat-message-bubble"
import { ChatPromptBar } from "@/components/chat/chat-prompt-bar"
import { ThinkingTrace } from "@/components/chat/thinking-trace"
import { CardRenderer } from "@/components/genui/card-renderer"
import { ActivityRunControls } from "@/components/session/activity-run-controls"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ApprovalDecisionRecord, ActivityStreamEvent, PlanReviewDecision } from "@/lib/genui/types"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import type { SessionThought, SessionUserMessage } from "@/lib/session/types"
import { cn } from "@/lib/utils"

type ChatSessionPanelProps = {
  activityId: string
  activityName?: string
  userMessage?: SessionUserMessage
  thoughts?: SessionThought[]
  streamEvents: ActivityStreamEvent[]
  chatMessages?: SessionChatMessage[]
  showPlanAction?: boolean
  onViewPlan?: () => void
  onClose?: () => void
  onSendMessage?: (content: string) => Promise<void>
  onPlanDecision?: (decision: PlanReviewDecision, gateId?: string) => void | Promise<void>
  isSending?: boolean
  isAwaitingResponse?: boolean
  streamStatus?: UseActivitySessionReturn["streamStatus"]
  sessionError?: UseActivitySessionReturn["sessionError"]
  onRetrySession?: UseActivitySessionReturn["retrySession"]
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
  onEditActivity?: () => void
  activityLocked?: boolean
  activityStatus?: string
  onStatusChange?: () => void | Promise<void>
  className?: string
}

export function ChatSessionPanel({
  activityId,
  activityName,
  userMessage,
  thoughts = [],
  streamEvents,
  chatMessages = [],
  showPlanAction = false,
  onViewPlan,
  onClose,
  onSendMessage,
  onPlanDecision,
  isSending = false,
  isAwaitingResponse = false,
  streamStatus = "idle",
  sessionError = null,
  onRetrySession,
  onApprovalDecision,
  onEditActivity,
  activityLocked = false,
  activityStatus,
  onStatusChange,
  className,
}: ChatSessionPanelProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const [decidedMap, setDecidedMap] = useState<Record<string, ApprovalDecisionRecord>>({})
  const [questionChoice, setQuestionChoice] = useState<{
    selectedOptionId?: string
    stepIndex: number
  }>({
    stepIndex: 1,
  })

  const isPlanConfirmed = useMemo(() => {
    if (activityStatus === "in_progress" || activityStatus === "completed") return true
    return streamEvents.some((e) => {
      if (
        e.event.type === "approval_gate" ||
        e.event.type === "journal_entry_review" ||
        e.event.type === "file_created"
      ) {
        return true
      }
      if (
        e.event.type === "progress" &&
        !e.event.data.stepDescription?.toLowerCase().includes("drafting")
      ) {
        return true
      }
      return false
    })
  }, [activityStatus, streamEvents])

  const cleanThoughtContent = useMemo(() => {
    const rawLines = thoughts.map((t) => t.text.replace(/^Completed:\s*/i, "").trim()).filter(Boolean)
    if (rawLines.length === 0) {
      return undefined
    }

    const seen = new Set<string>()
    const lines: string[] = []
    for (const text of rawLines) {
      if (
        text === "Working…" ||
        text.toLowerCase().includes("drafting the plan") ||
        text.toLowerCase().includes("reviewing client context")
      ) {
        continue
      }
      if (!seen.has(text)) {
        seen.add(text)
        lines.push(text)
      }
    }
    return lines.length > 0 ? lines.join("\n") : undefined
  }, [thoughts])

  const cardOptions = useMemo(
    () => ({
      activityId,
      canDecide: true,
      onDecision: async (
        gateId: string,
        payload: {
          decision: ApprovalDecisionRecord["decision"]
          notes?: string
          editedPayload?: Record<string, unknown>
        },
      ) => {
        if (onApprovalDecision) {
          await onApprovalDecision(gateId, payload)
        }
        setDecidedMap((current) => ({
          ...current,
          [gateId]: {
            decision: payload.decision,
            decidedBy: "You",
            decidedAt: new Date().toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }),
            notes: payload.notes,
          },
        }))
      },
      isPlanConfirmed,
      onPlanDecision: (decision: PlanReviewDecision) => {
        if (onPlanDecision) {
          void onPlanDecision(decision)
        }
      },
      questionChoice: {
        selectedOptionId: questionChoice.selectedOptionId,
        onSelect: (optionId: string) => {
          setQuestionChoice((current) => ({ ...current, selectedOptionId: optionId }))
          if (onSendMessage) {
            const questionEvent = streamEvents.find((e) => e.event.type === "question_choice")
            let label = optionId
            if (questionEvent && questionEvent.event.type === "question_choice") {
              const match = questionEvent.event.data.options.find((opt) => opt.id === optionId)
              if (match) label = match.label
            }
            void onSendMessage(label)
          }
        },
        onSkip: () => {
          setQuestionChoice((current) => ({ ...current, selectedOptionId: undefined }))
          if (onSendMessage) {
            void onSendMessage("Skip")
          }
        },
        onStepChange: (direction: "prev" | "next") =>
          setQuestionChoice((current) => ({
            ...current,
            stepIndex:
              direction === "prev"
                ? Math.max(1, current.stepIndex - 1)
                : current.stepIndex + 1,
          })),
      },
    }),
    [activityId, isPlanConfirmed, onApprovalDecision, onSendMessage, streamEvents, questionChoice.selectedOptionId, questionChoice.stepIndex],
  )
  const streamBadge = useMemo(() => {
    if (sessionError) {
      return (
        <span
          className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
          aria-live="polite"
        >
          Disconnected
        </span>
      )
    }
    if (!isAwaitingResponse) return null
    if (streamStatus === "connected") {
      return (
        <span
          className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
          aria-live="polite"
        >
          ● Live
        </span>
      )
    }
    if (streamStatus === "syncing") {
      return (
        <span
          className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700"
          aria-live="polite"
        >
          ◌ Syncing
        </span>
      )
    }
    if (streamStatus === "connecting") {
      return (
        <span
          className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
          aria-live="polite"
        >
          Connecting…
        </span>
      )
    }
    return null
  }, [sessionError, isAwaitingResponse, streamStatus])

  // Shown under the shimmering "Thoughts" label while we're waiting but no
  // reasoning has arrived — so a stream that never connects stays visible
  // instead of looking like the agent is quietly working.
  const thinkingStatus = !isAwaitingResponse
    ? undefined
    : streamStatus === "connected"
      ? "Working…"
      : streamStatus === "syncing"
        ? "Syncing latest updates with Athena…"
        : streamStatus === "connecting"
          ? "Connecting to Athena…"
          : "Waiting for Athena to start…"

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [chatMessages, streamEvents, isAwaitingResponse, isSending])

  return (
    <aside
      className={cn(
        "flex min-w-0 flex-1 flex-col border-l border-border/70 bg-background",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {activityName ? (
            <h2 className="min-w-0 truncate text-sm font-medium text-foreground">
              {activityName}
            </h2>
          ) : null}
          {showPlanAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 gap-1.5 px-2.5 text-xs font-mono font-normal rounded-md border-border text-foreground hover:bg-muted"
              onClick={onViewPlan}
              title="View deliverables and Excel workpaper"
            >
              <RiFileLine className="size-3.5" />
              <span>3</span>
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <ActivityRunControls
            activityId={activityId}
            activityStatus={activityStatus}
            onStatusChange={onStatusChange}
          />
          {onEditActivity ? (
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md hover:bg-muted/50 disabled:opacity-40"
              aria-label={activityLocked ? "Task is locked" : "Edit task"}
              title={activityLocked ? "Task is locked" : "Edit task"}
              disabled={activityLocked}
              onClick={onEditActivity}
            >
              <RiEditLine className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted/50"
            aria-label="Copy link"
            title="Copy link"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/activities/${activityId}`)
                .then(() => toast.success("Link copied"))
                .catch(() => toast.error("Could not copy the link"))
            }}
          >
            <RiLinkM className="size-4" />
          </button>
          {streamBadge}
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted/50"
            aria-label="Close session"
            onClick={onClose}
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 sm:px-6 py-6">
          {userMessage ? <LegacyUserMessageBubble message={userMessage} /> : null}

          {chatMessages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {thoughts.length > 0 || streamEvents.length > 0 || isAwaitingResponse ? (
            <ThinkingTrace
              thoughtContent={cleanThoughtContent}
              isThinking={isAwaitingResponse}
              statusLabel={thinkingStatus}
              defaultExpanded={false}
            />
          ) : null}

          <div className="space-y-4">
            {streamEvents
              .filter((event, index, all) => {
                // Filter out generic progress and checklist cards to prevent AI slop
                if (event.event.type === "progress" || event.event.type === "checklist") {
                  return false
                }
                // If an approval gate exists, hide redundant standalone journal entry review cards
                if (event.event.type === "journal_entry_review") {
                  const hasApprovalGate = all.some((e) => e.event.type === "approval_gate")
                  if (hasApprovalGate) return false
                }
                // If it's an approval gate, only show the latest occurrence (by gateId, title, or latest gate)
                if (event.event.type === "approval_gate") {
                  const gateId = (event.event.data as any)?.gateId
                  const title = (event.event.data.title || "").trim().toLowerCase()
                  const lastGateIndex = all.findLastIndex((e) => {
                    if (e.event.type !== "approval_gate") return false
                    const otherGateId = (e.event.data as any)?.gateId
                    const otherTitle = (e.event.data.title || "").trim().toLowerCase()
                    if (gateId && otherGateId && gateId === otherGateId) return true
                    if (title && otherTitle && title === otherTitle) return true
                    return !title || !otherTitle
                  })
                  return index === lastGateIndex
                }
                return true
              })
              .map((event, _idx, all) => {
                // If approval gate is missing lines in payload, merge from preceding journal_entry_review
                let enrichedEvent = event
                if (event.event.type === "approval_gate") {
                  const jeEvent = streamEvents.find((e) => e.event.type === "journal_entry_review")
                  if (jeEvent && jeEvent.event.type === "journal_entry_review") {
                    const payload = (event.event.data as any).payload ?? {}
                    if (!payload.lines && !payload.journalEntries) {
                      enrichedEvent = {
                        ...event,
                        event: {
                          ...event.event,
                          data: {
                            ...event.event.data,
                            payload: {
                              ...payload,
                              journalEntries: [jeEvent.event.data],
                            },
                          },
                        },
                      }
                    }
                  }
                }

                return (
                  <div key={event.id} className="flex w-full justify-start">
                    <div className="w-full max-w-[min(100%,42rem)]">
                      <CardRenderer
                        event={
                          enrichedEvent.event.type === "question_choice"
                            ? {
                                ...enrichedEvent,
                                event: {
                                  ...enrichedEvent.event,
                                  data: {
                                    ...enrichedEvent.event.data,
                                    selectedOptionId: questionChoice.selectedOptionId,
                                    stepIndex: questionChoice.stepIndex,
                                  },
                                },
                              }
                            : enrichedEvent
                        }
                        options={{
                          ...cardOptions,
                          isLive: enrichedEvent.event.type === "progress" && isAwaitingResponse,
                          decision:
                            enrichedEvent.event.type === "approval_gate" && (enrichedEvent.event.data as any)?.gateId
                              ? decidedMap[(enrichedEvent.event.data as any)?.gateId]
                              : undefined,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>

          <div ref={scrollAnchorRef} />
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border/70 p-4 space-y-3">
        {sessionError ? (
          <div
            role="alert"
            className="mx-auto w-full max-w-3xl rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {sessionError.kind === "auth"
                    ? "Authentication Required"
                    : sessionError.kind === "not_found"
                      ? "Session Not Found"
                      : "Live Sync Paused"}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {sessionError.message}
                </p>
              </div>
              {onRetrySession ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (sessionError.kind === "auth") {
                      window.location.reload()
                    } else {
                      void onRetrySession()
                    }
                  }}
                  className="shrink-0 h-7 px-3 text-xs"
                >
                  {sessionError.kind === "auth" ? "Sign In / Reload" : "Retry Connection"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {onSendMessage ? (
          <div className="relative mx-auto max-w-3xl">
            <ChatPromptBar
              placeholder="Ask a follow-up…"
              onSubmit={(content) => void onSendMessage(content)}
            />
            {isSending ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
                <Spinner className="size-4 text-muted-foreground" />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="px-1 text-[11px] text-muted-foreground">
            <span className="font-medium">↑ ↓</span> to navigate ·{" "}
            <span className="font-medium">Enter</span> to select ·{" "}
            <span className="font-medium">Esc</span> to skip
          </p>
        )}
      </footer>
    </aside>
  )
}

function LegacyUserMessageBubble({ message }: { message: SessionUserMessage }) {
  return (
    <div className="flex w-full flex-col items-end gap-1">
      <div className="max-w-[min(85%,42rem)] rounded-2xl rounded-br-md bg-muted/60 px-4 py-3 text-xs leading-relaxed text-foreground">
        {message.title ? <p className="mb-2 font-medium">{message.title}</p> : null}
        <p className="whitespace-pre-wrap">{message.body}</p>
      </div>
      <span className="pr-1 text-[11px] text-muted-foreground/70">
        Sent by CPA on {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}, {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  )
}
