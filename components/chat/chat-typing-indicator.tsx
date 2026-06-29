"use client"

import { cn } from "@/lib/utils"

type ChatTypingIndicatorProps = {
  label?: string
  className?: string
}

export function ChatTypingIndicator({
  label = "Athena is thinking…",
  className,
}: ChatTypingIndicatorProps) {
  return (
    <div className={cn("flex w-full justify-start", className)}>
      <div className="flex max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-md border border-border/60 bg-background px-4 py-3 shadow-xs">
        <div className="flex items-center gap-1" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="animate-pulse">{label}</span>
        </p>
      </div>
    </div>
  )
}
