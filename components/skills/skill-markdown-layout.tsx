"use client"

import type { ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type SkillMarkdownLayoutProps = {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SkillMarkdownLayout({
  children,
  footer,
  className,
}: SkillMarkdownLayoutProps) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-background", className)}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="font-document w-full px-5 py-7 pb-24 sm:px-8 lg:px-10 lg:py-9" data-official-content>
          {children}
        </div>
      </ScrollArea>
      {footer ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 px-4 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
