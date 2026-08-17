"use client"

import { cn } from "@/lib/utils"

type AgentOrbProps = {
  size?: number
  className?: string
  variant?: "lattice" | "pulse" | "spark"
  label?: string
}

export function AgentOrb({
  size = 16,
  className,
  variant = "lattice",
  label,
}: AgentOrbProps) {
  if (variant === "spark") {
    return (
      <span className={cn("relative inline-flex items-center justify-center", className)}>
        <span className="size-2 rounded-full bg-primary/80 animate-ping absolute" />
        <span className="size-2 rounded-full bg-primary relative" />
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center select-none", className)}
      role="img"
      aria-label={label || "Agent working…"}
      style={{ width: size, height: size }}
    >
      <span className="relative grid grid-cols-3 gap-[2.5px] p-[1px] size-full items-center justify-center">
        <span className="size-1 rounded-full bg-primary/70 animate-pulse [animation-delay:0ms]" />
        <span className="size-1 rounded-full bg-primary/50 animate-pulse [animation-delay:200ms]" />
        <span className="size-1 rounded-full bg-primary/80 animate-pulse [animation-delay:400ms]" />
        <span className="size-1 rounded-full bg-primary/40 animate-pulse [animation-delay:600ms]" />
        <span className="size-1 rounded-full bg-foreground/90 animate-ping [animation-duration:1.5s]" />
        <span className="size-1 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
        <span className="size-1 rounded-full bg-primary/80 animate-pulse [animation-delay:500ms]" />
        <span className="size-1 rounded-full bg-primary/50 animate-pulse [animation-delay:100ms]" />
        <span className="size-1 rounded-full bg-primary/70 animate-pulse [animation-delay:700ms]" />
      </span>
    </span>
  )
}
