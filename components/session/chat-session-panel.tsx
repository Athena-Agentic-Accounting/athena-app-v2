"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  RiCloseLine,
  RiEditLine,
  RiLayoutLeft2Line,
  RiLinkM,
} from "@remixicon/react"
import { toast } from "sonner"

import { ChatMessageBubble } from "@/components/chat/chat-message-bubble"
import { ChatPromptBar } from "@/components/chat/chat-prompt-bar"
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator"
import { CardRenderer } from "@/components/genui/card-renderer"
import { ActivityRunControls } from "@/components/session/activity-run-controls"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ActivityStreamEvent } from "@/lib/genui/types"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import type { SessionOutputItem } from "@/lib/session/output-items"
import type { SessionThought, SessionUserMessage } from "@/lib/session/types"
import { cn } from "@/lib/utils"

type ChatSessionPanelProps = {
  activityId: string
  activityName?: string
  userMessage?: SessionUserMessage
  thoughts?: SessionThought[]
  streamEvents: ActivityStreamEvent[]
  chatMessages?: SessionChatMessage[]
  outputs?: SessionOutputItem[]
  onOpenOutputs?: () => void
  onClose?: () => void
  onSendMessage?: (content: string) => Promise<void>
  isSending?: boolean
  isAwaitingResponse?: boolean
  streamStatus?: UseActivitySessionReturn["streamStatus"]
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
  outputs = [],
  onOpenOutputs,
  onClose,
  onSendMessage,
  isSending = false,
  isAwaitingResponse = false,
  streamStatus = "idle",
  onEditActivity,
  activityLocked = false,
  activityStatus,
  onStatusChange,
  className,
}: ChatSessionPanelProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const [questionChoice, setQuestionChoice] = useState<{
    selectedOptionId?: string
    stepIndex: number
  }>({
    stepIndex: 1,
  })

  const activeQuestion = useMemo(
    () =>
      [...streamEvents]
        .reverse()
        .find((event) => event.event.type === "question_choice"),
    [streamEvents],
  )

  const lastUserMessage = useMemo(() => {
    return chatMessages.filter((m) => m.role === "user").at(-1)
  }, [chatMessages])

  const currentTurnProgressEvents = useMemo(() => {
    if (!lastUserMessage?.createdAt) {
      return streamEvents.filter((event) => event.event.type === "progress")
    }
    const userTime = new Date(lastUserMessage.createdAt).getTime()
    if (Number.isNaN(userTime)) return []
    return streamEvents.filter((event) => {
      if (event.event.type !== "progress" || !event.timestamp) return false
      const eventTime = new Date(event.timestamp).getTime()
      return !Number.isNaN(eventTime) && eventTime >= userTime
    })
  }, [streamEvents, lastUserMessage])

  const latestProgress = useMemo(() => {
    return currentTurnProgressEvents.at(-1)
  }, [currentTurnProgressEvents])

  const progressSteps = useMemo(
    () =>
      currentTurnProgressEvents
        .map((event) =>
          event.event.type === "progress" ? event.event.data.stepDescription : "",
        )
        .filter((step, index, all) => Boolean(step) && all.indexOf(step) === index)
        .slice(-4),
    [currentTurnProgressEvents],
  )

  const activeQuestionData =
    activeQuestion?.event.type === "question_choice"
      ? activeQuestion.event.data
      : undefined

  const progressLabel =
    latestProgress?.event.type === "progress"
      ? latestProgress.event.data.stepDescription
      : thoughts.at(-1)?.text

  const streamLabel = isAwaitingResponse
    ? streamStatus === "connected"
      ? "Live"
      : streamStatus === "connecting"
        ? "Connecting…"
        : streamStatus === "error"
          ? "Reconnecting…"
          : null
    : null

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [chatMessages, outputs.length, streamEvents, isAwaitingResponse, isSending])

  return (
    <aside
      id="session-conversation-panel"
      data-chat-interface
      className={cn(
        "min-w-0 flex-1 flex-col border-l border-border/70 bg-background",
        className,
      )}
      aria-label="Activity conversation"
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 px-3">
        <div className="min-w-0 flex-1 px-1">
          <p className="text-[10px] font-medium uppercase leading-3 tracking-[0.14em] text-muted-foreground">
            Conversation
          </p>
          {activityName ? (
            <h2 className="truncate text-sm font-medium text-foreground">
              {activityName}
            </h2>
          ) : (
            <h2 className="text-sm font-medium text-foreground">Activity</h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
          {onOpenOutputs ? (
            <HeaderAction label="Show workpapers" onClick={onOpenOutputs}>
              <RiLayoutLeft2Line className="size-4" />
            </HeaderAction>
          ) : null}
          <ActivityRunControls
            activityId={activityId}
            activityStatus={activityStatus}
            onStatusChange={onStatusChange}
          />
          {onEditActivity ? (
            <HeaderAction
              label={activityLocked ? "Task is locked" : "Edit task"}
              disabled={activityLocked}
              onClick={onEditActivity}
            >
              <RiEditLine className="size-4" />
            </HeaderAction>
          ) : null}
          <HeaderAction
            label="Copy activity link"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/activities/${activityId}`)
                .then(() => toast.success("Link copied"))
                .catch(() => toast.error("Could not copy the link"))
            }}
          >
            <RiLinkM className="size-4" />
          </HeaderAction>
          {streamLabel ? (
            <span
              className={cn(
                "mx-1 rounded-md px-1.5 py-1 text-[10px] font-medium",
                streamStatus === "error"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {streamLabel}
            </span>
          ) : null}
          <HeaderAction label="Close session" onClick={onClose}>
            <RiCloseLine className="size-4" />
          </HeaderAction>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5">
          {userMessage ? <LegacyUserMessageBubble message={userMessage} /> : null}

          {chatMessages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {outputs.length > 0 && onOpenOutputs ? (
            <div className="my-1 flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 transition-colors">
              <div className="flex items-center gap-2">
                <RiLayoutLeft2Line className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {outputs.length} prepared workpaper{outputs.length > 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenOutputs}
                className="text-xs font-medium text-primary hover:underline"
              >
                View workpapers →
              </button>
            </div>
          ) : null}

          {activeQuestion?.event.type === "question_choice" && activeQuestionData ? (
            <CardRenderer
              event={{
                ...activeQuestion,
                event: {
                  ...activeQuestion.event,
                  data: {
                    ...activeQuestion.event.data,
                    selectedOptionId: questionChoice.selectedOptionId,
                    stepIndex: questionChoice.stepIndex,
                  },
                },
              }}
              options={{
                questionChoice: {
                  selectedOptionId: questionChoice.selectedOptionId,
                  onSelect: (optionId) => {
                    setQuestionChoice((current) => ({ ...current, selectedOptionId: optionId }))
                    const match = activeQuestionData.options.find(
                      (option) => option.id === optionId,
                    )
                    if (onSendMessage) void onSendMessage(match?.label ?? optionId)
                  },
                  onSkip: () => {
                    setQuestionChoice((current) => ({
                      ...current,
                      selectedOptionId: undefined,
                    }))
                    if (onSendMessage) void onSendMessage("Skip")
                  },
                  onStepChange: (direction) =>
                    setQuestionChoice((current) => ({
                      ...current,
                      stepIndex:
                        direction === "prev"
                          ? Math.max(1, current.stepIndex - 1)
                          : current.stepIndex + 1,
                    })),
                },
              }}
            />
          ) : null}

          {isAwaitingResponse ? (
            <ChatTypingIndicator label={progressLabel} steps={progressSteps} />
          ) : null}

          <div ref={scrollAnchorRef} />
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border/70 bg-background p-3">
        {onSendMessage ? (
          <div className="relative mx-auto max-w-2xl">
            <ChatPromptBar
              placeholder="Ask a follow-up…"
              className="bg-muted/20"
              onSubmit={(content) => void onSendMessage(content)}
            />
            {isSending ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/75">
                <Spinner className="size-4 text-muted-foreground" />
              </div>
            ) : null}
          </div>
        ) : null}
      </footer>
    </aside>
  )
}

function HeaderAction({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-md transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function LegacyUserMessageBubble({ message }: { message: SessionUserMessage }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[85%] rounded-xl rounded-br-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {message.title ? <p className="mb-1.5 font-medium">{message.title}</p> : null}
        <p className="whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  )
}
