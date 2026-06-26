import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type MainContentPanelProps = {
  children: ReactNode
  className?: string
}

export function MainContentPanel({ children, className }: MainContentPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] bg-background",
        className,
      )}
    >
      {children}
    </div>
  )
}
