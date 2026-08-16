"use client";

import { Button } from "@/components/ui/button";
import type { PlanReviewDecision } from "@/lib/genui/types";

type PlanReviewActionsProps = {
  onDecision?: (decision: PlanReviewDecision) => void;
  disabled?: boolean;
};

export function PlanReviewActions({
  onDecision,
  disabled,
}: PlanReviewActionsProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-4 py-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => onDecision?.("reject")}
      >
        Reject plan
      </Button>

      <Button
        type="button"
        size="sm"
        disabled={disabled}
        className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        onClick={() => onDecision?.("start_now")}
      >
        Confirm plan & start
      </Button>
    </div>
  );
}
