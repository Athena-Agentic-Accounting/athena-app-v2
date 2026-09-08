"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type ChatTypingIndicatorProps = {
  label?: string
  steps?: string[]
  className?: string
}

const WORKING_STAGES = [
  "Understanding the request",
  "Reviewing the available records",
  "Checking the relevant balances and details",
  "Preparing the response",
] as const

export function ChatTypingIndicator({
  label,
  steps = [],
  className,
}: ChatTypingIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    if (label) return

    const interval = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % WORKING_STAGES.length)
    }, 2400)

    return () => window.clearInterval(interval)
  }, [label])

  const defaultSteps = WORKING_STAGES.slice(0, stageIndex + 1)
  const activitySteps = steps.length > 0 ? [...steps] : [...defaultSteps]
  if (label && activitySteps.at(-1) !== label) activitySteps.push(label)
  const visibleSteps = activitySteps.slice(-3)
  const activeLabel = visibleSteps.at(-1) ?? label ?? WORKING_STAGES[stageIndex]

  return (
    <div
      data-chat-interface
      className={cn("flex w-full justify-start py-1.5", className)}
      role="status"
      aria-live="polite"
      aria-label={`Athena is working: ${activeLabel}`}
    >
      <div className="min-w-0 max-w-[34rem]" aria-hidden="true">
        <div className="flex h-5 items-center gap-2">
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <span className="size-1 animate-pulse rounded-full bg-muted-foreground/70" />
            <span className="size-1 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:160ms]" />
            <span className="size-1 animate-pulse rounded-full bg-muted-foreground/30 [animation-delay:320ms]" />
          </span>
          <span className="athena-thinking-shimmer text-xs font-medium">Thinking…</span>
        </div>

        <div className="mt-2 ml-1.5 space-y-1.5 border-l border-border/70 pl-3">
          {visibleSteps.map((step, index) => {
            const active = index === visibleSteps.length - 1
            return (
              <p
                key={`${step}-${index}`}
                className={cn(
                  "relative text-[12px] leading-5 transition-colors duration-150",
                  active ? "text-foreground/80" : "text-muted-foreground/65",
                )}
              >
                {active ? (
                  <span className="absolute top-2 -left-[15px] size-1.5 rounded-full bg-primary ring-2 ring-background" />
                ) : null}
                {step}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}
