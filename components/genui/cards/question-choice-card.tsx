"use client"

import { useState } from "react"
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import type { QuestionChoiceCardData } from "@/lib/genui/types"
import { cn } from "@/lib/utils"

type QuestionChoiceCardProps = {
  data: QuestionChoiceCardData
  selectedOptionId?: string
  onSelect?: (optionId: string) => void
  onSkip?: () => void
  onStepChange?: (direction: "prev" | "next") => void
}

export function QuestionChoiceCard({
  data,
  selectedOptionId,
  onSelect,
  onSkip,
  onStepChange,
}: QuestionChoiceCardProps) {
  const [internalSelection, setInternalSelection] = useState<string | undefined>(
    data.selectedOptionId,
  )

  const activeId = selectedOptionId ?? internalSelection
  const stepIndex = data.stepIndex ?? 1
  const stepCount = data.stepCount ?? 1
  const showPager = stepCount > 1

  function handleSelect(optionId: string) {
    setInternalSelection(optionId)
    onSelect?.(optionId)
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border/70 bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold leading-snug text-foreground">{data.question}</h3>
        {showPager ? (
          <div className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
              disabled={stepIndex <= 1}
              aria-label="Previous question"
              onClick={() => onStepChange?.("prev")}
            >
              <RiArrowLeftSLine className="size-4" />
            </button>
            <span className="min-w-[42px] text-center tabular-nums">
              {stepIndex} of {stepCount}
            </span>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
              disabled={stepIndex >= stepCount}
              aria-label="Next question"
              onClick={() => onStepChange?.("next")}
            >
              <RiArrowRightSLine className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {data.description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
      ) : null}

      <ul className="mt-4 space-y-1">
        {data.options.map((option, index) => {
          const selected = activeId === option.id

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition-colors",
                  selected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded text-xs font-medium tabular-nums",
                    selected ? "bg-background text-foreground ring-1 ring-border/70" : "text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex-1">{option.label}</span>
                {selected ? <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" /> : null}
              </button>
            </li>
          )
        })}
      </ul>

      {data.allowSkip !== false ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs font-normal"
            onClick={() => onSkip?.()}
          >
            {data.skipLabel ?? "Skip"}
          </Button>
        </div>
      ) : null}
    </article>
  )
}
