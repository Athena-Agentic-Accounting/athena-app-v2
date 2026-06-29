"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  RiCalendarLine,
  RiCloseLine,
  RiEditLine,
  RiLinkM,
} from "@remixicon/react"

import { ChatMessageBubble } from "@/components/chat/chat-message-bubble"
import { ChatPromptBar } from "@/components/chat/chat-prompt-bar"
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator"
import { CardRenderer } from "@/components/genui/card-renderer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ApprovalDecisionRecord, ActivityStreamEvent } from "@/lib/genui/types"
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
  isSending?: boolean
  isAwaitingResponse?: boolean
  streamStatus?: UseActivitySessionReturn["streamStatus"]
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
  onEditActivity?: () => void
  activityLocked?: boolean
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
  isSending = false,
  isAwaitingResponse = false,
  streamStatus = "idle",
  onApprovalDecision,
  onEditActivity,
  activityLocked = false,
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
      questionChoice: {
        selectedOptionId: questionChoice.selectedOptionId,
        onSelect: (optionId: string) =>
          setQuestionChoice((current) => ({ ...current, selectedOptionId: optionId })),
        onSkip: () =>
          setQuestionChoice((current) => ({ ...current, selectedOptionId: undefined })),
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
    [activityId, onApprovalDecision, questionChoice.selectedOptionId, questionChoice.stepIndex],
  )

  const latestProgress = useMemo(() => {
    const progressEvents = streamEvents.filter((event) => event.event.type === "progress")
    return progressEvents.at(-1)
  }, [streamEvents])

  const progressLabel =
    latestProgress?.event.type === "progress"
      ? latestProgress.event.data.stepDescription
      : thoughts.at(-1)?.text

  const streamLabel =
    streamStatus === "connected"
      ? "Live"
      : streamStatus === "connecting"
        ? "Connecting…"
        : streamStatus === "error"
          ? "Reconnecting…"
          : null

  const typingLabel =
    progressLabel ??
    (streamStatus === "connected" ? "Athena is responding…" : "Waiting for Athena…")

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
              className="h-7 shrink-0 px-3 text-xs font-normal"
              onClick={onViewPlan}
            >
              View plan
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
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
          >
            <RiLinkM className="size-4" />
          </button>
          {streamLabel ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                streamStatus === "error"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              {streamLabel}
            </span>
          ) : null}
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted/50"
            aria-label="Schedule"
          >
            <RiCalendarLine className="size-4" />
          </button>
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
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
          {userMessage ? <LegacyUserMessageBubble message={userMessage} /> : null}

          {chatMessages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {isAwaitingResponse ? (
            progressLabel ? (
              <div className="flex justify-start">
                <p className="max-w-[85%] text-xs text-muted-foreground">{progressLabel}</p>
              </div>
            ) : null
          ) : null}

          {isAwaitingResponse ? <ChatTypingIndicator label={typingLabel} /> : null}

          <div className="space-y-4">
            {streamEvents.map((event) => (
              <div key={event.id} className="flex w-full justify-start">
                <div className="w-full max-w-[min(100%,42rem)]">
                  <CardRenderer
                    event={
                      event.event.type === "question_choice"
                        ? {
                            ...event,
                            event: {
                              ...event.event,
                              data: {
                                ...event.event.data,
                                selectedOptionId: questionChoice.selectedOptionId,
                                stepIndex: questionChoice.stepIndex,
                              },
                            },
                          }
                        : event
                    }
                    options={{
                      ...cardOptions,
                      isLive: event.event.type === "progress" && isAwaitingResponse,
                      decision:
                        event.event.type === "approval_gate" && event.event.data.gateId
                          ? decidedMap[event.event.data.gateId]
                          : undefined,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div ref={scrollAnchorRef} />
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border/70 p-4">
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
    <div className="flex w-full justify-end">
      <div className="max-w-[min(85%,42rem)] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
        {message.title ? <p className="mb-2 font-medium">{message.title}</p> : null}
        <p className="whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  )
}
