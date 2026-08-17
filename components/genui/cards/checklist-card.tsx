"use client"

import { useState } from "react"
import {
  RiCheckLine,
  RiLockLine,
  RiLoader4Line,
  RiArrowRightLine,
  RiCloseLine,
  RiShieldCheckLine,
} from "@remixicon/react"

import type { ChecklistCardData, PlanReviewDecision } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChecklistCardProps = {
  data: ChecklistCardData
  isConfirmed?: boolean
  onPlanDecision?: (decision: PlanReviewDecision) => void | Promise<void>
}

function inferStepMetadata(label: string, index: number) {
  const lower = label.toLowerCase()
  if (lower.includes("gl") || lower.includes("extract") || lower.includes("feed")) {
    return { tag: "GL Ingest", isGate: false, type: "automated" as const }
  }
  if (lower.includes("amortization") || lower.includes("schedule") || lower.includes("construct")) {
    return { tag: "Schedule Engine", isGate: false, type: "automated" as const }
  }
  if (lower.includes("accrual") || lower.includes("reversing")) {
    return { tag: "Accrual Logic", isGate: false, type: "automated" as const }
  }
  if (lower.includes("excel") || lower.includes("workpaper") || lower.includes("generate")) {
    return { tag: "Workpaper Export", isGate: false, type: "deliverable" as const }
  }
  if (lower.includes("post") || lower.includes("journal entry") || lower.includes("approval") || lower.includes("quickbooks")) {
    return { tag: "Approval Gate", isGate: true, type: "gate" as const }
  }
  return { tag: `Step ${index + 1}`, isGate: false, type: "automated" as const }
}

export function ChecklistCard({ data, isConfirmed, onPlanDecision }: ChecklistCardProps) {
  const [deciding, setDeciding] = useState(false)
  const [localConfirmed, setLocalConfirmed] = useState(false)
  const confirmed = Boolean(isConfirmed || localConfirmed)

  const isProposedPlan =
    data.title?.toLowerCase().includes("plan") ||
    data.title?.toLowerCase().includes("proposed") ||
    data.items.length >= 3

  async function handleDecision(decision: PlanReviewDecision) {
    setDeciding(true)
    try {
      if (decision === "start_now") setLocalConfirmed(true)
      await onPlanDecision?.(decision)
    } finally {
      setDeciding(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors mx-1 sm:mx-2">
      {/* Ramp-style Pipeline Header */}
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <RiShieldCheckLine className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {getCardTitle("checklist", data.title || "Execution Plan")}
            </h3>
          </div>
        </div>

        <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
          {data.items.length} steps · Advisory
        </span>
      </header>

      {/* Stepper Steps List */}
      <div className="divide-y divide-border/40 px-2 py-1">
        {data.items.map((item, index) => {
          const meta = inferStepMetadata(item.label, index)
          const isDone = item.done
          const isRunning = confirmed && !isDone && index === 0

          return (
            <div
              key={`${item.label}-${index}`}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 transition-colors rounded-lg",
                isRunning ? "bg-primary/5" : "hover:bg-muted/10",
              )}
            >
              {/* Step indicator */}
              <div className="pt-0.5">
                {isDone ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 font-medium">
                    <RiCheckLine className="size-3.5" />
                  </div>
                ) : isRunning ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary animate-pulse">
                    <RiLoader4Line className="size-3.5 animate-spin" />
                  </div>
                ) : meta.isGate ? (
                  <div className="flex size-5 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600">
                    <RiLockLine className="size-3" />
                  </div>
                ) : (
                  <div className="flex size-5 items-center justify-center rounded-full border border-border bg-muted/40 text-[11px] font-mono text-muted-foreground">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p
                    className={cn(
                      "text-xs leading-relaxed font-normal",
                      isDone ? "text-muted-foreground line-through decoration-border-strong" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </p>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 text-[10px] font-mono",
                      meta.isGate
                        ? "bg-amber-500/10 text-amber-700 font-medium"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {meta.tag}
                  </span>
                </div>

                {item.detail ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Footer for Proposed Plans */}
      {isProposedPlan ? (
        <footer className="flex items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-2.5">
          {confirmed ? (
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <RiCheckLine className="size-4" />
                Plan confirmed · Execution in progress
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Automated CPA workflow
              </span>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deciding}
                onClick={() => void handleDecision("reject")}
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RiCloseLine className="size-3.5" />
                Reject
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={deciding}
                onClick={() => void handleDecision("start_now")}
                className="h-8 gap-1.5 bg-primary px-3.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                {deciding ? (
                  <>
                    <RiLoader4Line className="size-3.5 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    Confirm plan & start
                    <RiArrowRightLine className="size-3.5" />
                  </>
                )}
              </Button>
            </>
          )}
        </footer>
      ) : null}
    </article>
  )
}
