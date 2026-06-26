"use client"

import { Button } from "@/components/ui/button"
import type { PlanReviewDecision } from "@/lib/genui/types"

type PlanReviewActionsProps = {
  onDecision?: (decision: PlanReviewDecision) => void
  disabled?: boolean
}

export function PlanReviewActions({ onDecision, disabled }: PlanReviewActionsProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/70 px-4 py-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onDecision?.("save")}
      >
        Save changes
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => onDecision?.("reject")}
      >
        Reject
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        onClick={() => onDecision?.("schedule")}
      >
        Schedule
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        className="bg-emerald-700 text-white hover:bg-emerald-800"
        onClick={() => onDecision?.("start_now")}
      >
        Start now
      </Button>
    </div>
  )
}
