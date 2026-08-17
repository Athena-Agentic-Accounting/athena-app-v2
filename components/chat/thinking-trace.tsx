"use client";

import { ThinkingReasoning, type ThinkingReasoningProps } from "./ThinkingReasoning";

export type ThinkingTraceProps = {
  /** Reasoning lines, already cleaned. Falsy → nothing to expand. */
  thoughtContent?: string;
  /** True while the agent is still reasoning — label shimmers, no chevron. */
  isThinking?: boolean;
  /** Connection/wait state, shown only while thinking with nothing to show yet. */
  statusLabel?: string;
  /** Auto-expand while thinking so the user watches it stream. */
  defaultExpanded?: boolean;
  /** Direct array of reasoning strings if preferred */
  sentences?: string[];
  /** Elapsed seconds to display in summary */
  elapsedSeconds?: number;
  className?: string;
};

export function ThinkingTrace({
  thoughtContent,
  isThinking = false,
  statusLabel,
  defaultExpanded = false,
  sentences,
  elapsedSeconds,
  className,
}: ThinkingTraceProps) {
  return (
    <ThinkingReasoning
      thoughtContent={thoughtContent}
      sentences={sentences}
      isThinking={isThinking}
      statusLabel={statusLabel}
      defaultOpen={defaultExpanded}
      elapsedSeconds={elapsedSeconds}
      className={className}
    />
  );
}

export { ThinkingReasoning };
