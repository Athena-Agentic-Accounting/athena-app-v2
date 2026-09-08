"use client"

import { useMemo, useState } from "react"
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react"

import { CardRenderer } from "@/components/genui/card-renderer"
import { MarkdownContent } from "@/components/session/markdown-content"
import { PlanReviewActions } from "@/components/session/plan-review-actions"
import { PlanReviewContent } from "@/components/session/plan-review-content"
import { SessionOutputIcon } from "@/components/session/session-output-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { UseActivitySessionReturn } from "@/hooks/use-activity-session"
import type { ApprovalDecisionRecord, ActivityStreamEvent, PlanReviewDecision } from "@/lib/genui/types"
import {
  enrichOutputEvent,
  type SessionOutputItem,
  type SessionOutputStatus,
} from "@/lib/session/output-items"
import { cn } from "@/lib/utils"

type ArtifactPanelProps = {
  outputs: SessionOutputItem[]
  streamEvents: ActivityStreamEvent[]
  activeOutputId?: string
  onActiveOutputChange?: (outputId: string) => void
  onPlanDecision?: (
    decision: PlanReviewDecision,
    gateId?: string,
  ) => void | Promise<void>
  onApprovalDecision?: UseActivitySessionReturn["handleApprovalDecision"]
  onBackToConversation?: () => void
  onCloseWorkpaper?: () => void
  className?: string
}

export function ArtifactPanel({
  outputs,
  streamEvents,
  activeOutputId,
  onActiveOutputChange,
  onPlanDecision,
  onApprovalDecision,
  onBackToConversation,
  onCloseWorkpaper,
  className,
}: ArtifactPanelProps) {
  const [planDecided, setPlanDecided] = useState(false)
  const [decidedMap, setDecidedMap] = useState<Record<string, ApprovalDecisionRecord>>({})
  const activeOutput =
    outputs.find((output) => output.id === activeOutputId) ?? outputs.at(-1)

  const activeEvent = useMemo(() => {
    if (!activeOutput || activeOutput.source !== "event") return undefined
    return enrichOutputEvent(activeOutput.event, streamEvents)
  }, [activeOutput, streamEvents])

  if (!activeOutput) return null

  async function handlePlanDecision(decision: PlanReviewDecision) {
    if (
      !activeOutput ||
      activeOutput.source !== "artifact" ||
      activeOutput.tab.kind !== "plan_review"
    ) {
      return
    }

    await onPlanDecision?.(decision, activeOutput.tab.gateId)
    if (decision === "reject" || decision === "start_now") {
      setPlanDecided(true)
    }
  }

  const approvalHandler = onApprovalDecision
    ? async (
        gateId: string,
        payload: {
          decision: ApprovalDecisionRecord["decision"]
          notes?: string
          editedPayload?: Record<string, unknown>
        },
      ) => {
        await onApprovalDecision(gateId, payload)
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
      }
    : undefined

  return (
    <section
      className={cn(
        "font-document flex min-h-0 min-w-0 flex-1 flex-col bg-background",
        className,
      )}
      aria-label="Activity workpapers"
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBackToConversation ? (
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label="Back to conversation"
              onClick={onBackToConversation}
            >
              <RiArrowLeftLine className="size-4" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase leading-3 tracking-[0.14em] text-muted-foreground">
              Workpapers
            </p>
            <h1 className="truncate text-sm font-medium text-foreground">
              {activeOutput.title}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {outputs.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
                  aria-label="Switch workpaper"
                >
                  <span className="hidden tabular-nums sm:inline">
                    Workpapers ({outputs.length})
                  </span>
                  <span className="tabular-nums sm:hidden">{outputs.length}</span>
                  <RiArrowDownSLine className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {outputs.map((output) => (
                  <DropdownMenuItem
                    key={output.id}
                    onSelect={() => onActiveOutputChange?.(output.id)}
                    className="min-h-11 gap-2.5 py-2"
                  >
                    <SessionOutputIcon
                      output={output}
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground",
                        output.id === activeOutput.id && "text-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {output.title}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {output.category}
                      </span>
                    </span>
                    {output.id === activeOutput.id ? (
                      <RiCheckLine className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <OutputStatus status={activeOutput.status} />
          {onCloseWorkpaper ? (
            <button
              type="button"
              className="hidden size-9 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
              aria-label="Close workpaper"
              title="Close workpaper"
              onClick={onCloseWorkpaper}
            >
              <RiCloseLine className="size-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-24 sm:px-6 sm:py-7 xl:px-8">
            {activeOutput.source === "artifact" ? (
              activeOutput.tab.kind === "document" ? (
                <div className="mx-auto max-w-3xl">
                  {activeOutput.tab.description ? (
                    <div className="mb-6 border-b border-border/70 pb-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {activeOutput.tab.description}
                      </p>
                    </div>
                  ) : null}
                  <MarkdownContent markdown={activeOutput.tab.markdown} />
                </div>
              ) : (
                <PlanReviewContent
                  markdown={activeOutput.tab.markdown}
                  table={activeOutput.tab.table}
                />
              )
            ) : activeEvent ? (
              <CardRenderer
                event={activeEvent}
                options={{
                  activityId: activeEvent.activityId,
                  canDecide: true,
                  decision:
                    activeEvent.event.type === "approval_gate" &&
                    activeEvent.event.data.gateId
                      ? decidedMap[activeEvent.event.data.gateId]
                      : undefined,
                  onDecision: approvalHandler,
                }}
              />
            ) : null}
          </div>
        </ScrollArea>

        {activeOutput.source === "artifact" &&
        activeOutput.tab.kind === "plan_review" ? (
          <PlanReviewActions
            disabled={planDecided}
            onDecision={(decision) => void handlePlanDecision(decision)}
          />
        ) : null}
      </div>
    </section>
  )
}

function OutputStatus({ status }: { status: SessionOutputStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium",
        status === "ready" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "review" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        status === "attention" && "bg-destructive/10 text-destructive",
      )}
    >
      {status === "ready"
        ? "Ready"
        : status === "review"
          ? "Requires review"
          : "Needs attention"}
    </span>
  )
}
