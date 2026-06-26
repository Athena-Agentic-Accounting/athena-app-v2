"use client"

import type { ReactNode } from "react"
import {
  RiAlertLine,
  RiBarChartLine,
  RiCheckboxLine,
  RiFileTextLine,
  RiGridLine,
  RiLoader4Line,
  RiBookOpenLine,
  RiFileLine,
  RiQuestionLine,
  RiShieldCheckLine,
} from "@remixicon/react"

import type { CardType } from "@/lib/genui/types"
import { getCardVisualVariant } from "@/lib/genui/card-meta"
import { cn } from "@/lib/utils"

const CARD_ICONS: Record<CardType, typeof RiFileTextLine> = {
  progress: RiLoader4Line,
  narrative: RiFileTextLine,
  table: RiGridLine,
  journal_entry_review: RiBookOpenLine,
  checklist: RiCheckboxLine,
  chart: RiBarChartLine,
  file_created: RiFileLine,
  attention_required: RiAlertLine,
  approval_gate: RiShieldCheckLine,
  question_choice: RiQuestionLine,
}

type CardShellProps = {
  type: CardType
  title: string
  isLive?: boolean
  children: ReactNode
  className?: string
}

export function CardShell({ type, title, isLive = false, children, className }: CardShellProps) {
  const variant = getCardVisualVariant(type)
  const Icon = CARD_ICONS[type]

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border bg-background p-4",
        variant === "neutral" && "border-border/70",
        variant === "attention" && "border-amber-300 bg-amber-50/40",
        variant === "approval" && "border-border/70 border-l-4 border-l-red-500",
        className,
      )}
    >
      <header
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-medium",
          variant === "attention" && "text-amber-900",
          variant === "approval" && "text-foreground",
          variant === "neutral" && "text-foreground",
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            type === "progress" && isLive && "animate-spin text-muted-foreground",
            type === "progress" && !isLive && "text-muted-foreground",
            variant === "attention" && "text-amber-600",
            variant === "approval" && "text-red-600",
            variant === "neutral" && "text-muted-foreground",
          )}
        />
        <span className="truncate">{title}</span>
      </header>
      <div>{children}</div>
    </article>
  )
}
