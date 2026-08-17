"use client"

import { cn } from "@/lib/utils"

type ChatTypingIndicatorProps = {
  /** Defaults to "Thoughts" so the pre-stream state matches the thinking trace
   *  that replaces it once reasoning lines arrive. */
  label?: string
  className?: string
}

export function ChatTypingIndicator({
  label = "Athena is thinking…",
  className,
}: ChatTypingIndicatorProps) {
  return (
    <div className={cn("flex w-full items-center gap-2 py-1 text-xs text-muted-foreground", className)}>
      <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-600" />
      <span className="athena-thought-shimmer font-sans" role="status" aria-live="polite">
        {label}
      </span>
    </div>
  )
}
