"use client"

import { AttentionCard } from "@/components/genui/cards/attention-card"
import { ApprovalGateCard } from "@/components/genui/cards/approval-gate-card"
import { ChartCard } from "@/components/genui/cards/chart-card"
import { ChecklistCard } from "@/components/genui/cards/checklist-card"
import { FileCreatedCard } from "@/components/genui/cards/file-created-card"
import { JournalEntryCard } from "@/components/genui/cards/journal-entry-card"
import { NarrativeCard } from "@/components/genui/cards/narrative-card"
import { ProgressCard } from "@/components/genui/cards/progress-card"
import { QuestionChoiceCard } from "@/components/genui/cards/question-choice-card"
import { TableCard } from "@/components/genui/cards/table-card"
import type { ActivityStreamEvent, CardRendererOptions } from "@/lib/genui/types"

type CardRendererProps = {
  event: ActivityStreamEvent
  options?: CardRendererOptions
}

export function CardRenderer({ event, options = {} }: CardRendererProps) {
  const activityId = options.activityId ?? event.activityId

  switch (event.event.type) {
    case "progress":
      return <ProgressCard data={event.event.data} isLive={options.isLive} />
    case "narrative":
      return <NarrativeCard data={event.event.data} />
    case "table":
      return <TableCard data={event.event.data} />
    case "journal_entry_review":
      return <JournalEntryCard data={event.event.data} />
    case "checklist":
      return <ChecklistCard data={event.event.data} />
    case "chart":
      return <ChartCard data={event.event.data} />
    case "file_created":
      return <FileCreatedCard data={event.event.data} />
    case "attention_required":
      return <AttentionCard data={event.event.data} />
    case "approval_gate":
      return (
        <ApprovalGateCard
          data={event.event.data}
          activityId={activityId}
          canDecide={options.canDecide}
          decision={options.decision}
          onDecision={options.onDecision}
        />
      )
    case "question_choice":
      return (
        <QuestionChoiceCard
          data={event.event.data}
          selectedOptionId={options.questionChoice?.selectedOptionId}
          onSelect={options.questionChoice?.onSelect}
          onSkip={options.questionChoice?.onSkip}
          onStepChange={options.questionChoice?.onStepChange}
        />
      )
    default: {
      return null
    }
  }
}
