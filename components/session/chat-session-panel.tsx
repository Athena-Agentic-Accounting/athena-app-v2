"use client"

import { useMemo, useState } from "react"
import {
  RiCalendarLine,
  RiCloseLine,
  RiLinkM,
} from "@remixicon/react"

import { ChatPromptBar } from "@/components/chat/chat-prompt-bar"
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
  streamStatus?: UseActivitySessionReturn["streamStatus"]
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
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
  streamStatus = "idle",
  onApprovalDecision,
  className,
}: ChatSessionPanelProps) {
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

  const streamLabel =
    streamStatus === "connected"
      ? "Live"
      : streamStatus === "connecting"
        ? "Connecting…"
        : streamStatus === "error"
          ? "Stream offline"
          : null

  return (
    <aside
      className={cn(
        "flex w-[min(100%,22.5rem)] shrink-0 flex-col border-l border-border/70 bg-background",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
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
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted/50"
            aria-label="Copy link"
          >
            <RiLinkM className="size-4" />
          </button>
          {streamLabel ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
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
        <div className="space-y-4 p-4">
          {userMessage ? <UserMessageBubble message={userMessage} /> : null}

          {chatMessages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {thoughts.length > 0 ? <ThoughtsSection thoughts={thoughts} /> : null}

          <div className="space-y-3">
            {streamEvents.map((event) => (
              <CardRenderer
                key={event.id}
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
                  isLive: event.event.type === "progress",
                  decision:
                    event.event.type === "approval_gate" && event.event.data.gateId
                      ? decidedMap[event.event.data.gateId]
                      : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border/70 p-3">
        {onSendMessage ? (
          <div className="relative">
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

function UserMessageBubble({ message }: { message: SessionUserMessage }) {
  return (
    <div className="rounded-lg border border-border/50 bg-[#F5F0E8] px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
      {message.title ? (
        <p className="font-medium text-foreground">{message.title}</p>
      ) : null}
      <p className={cn(message.title ? "mt-2" : undefined)}>{message.body}</p>
    </div>
  )
}

function ChatMessageBubble({ message }: { message: SessionChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="rounded-lg border border-border/50 bg-[#F5F0E8] px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
        {message.content}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
      {message.content}
    </div>
  )
}

function ThoughtsSection({ thoughts }: { thoughts: SessionThought[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Thoughts</p>
      <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        {thoughts.map((thought) => (
          <li key={thought.id} className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
            <span>{thought.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
