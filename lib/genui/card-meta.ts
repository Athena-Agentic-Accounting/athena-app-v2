import type { CardType } from "@/lib/genui/types"

export type CardVisualVariant = "neutral" | "attention" | "approval"

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  progress: "Progress",
  narrative: "Update",
  table: "Table",
  journal_entry_review: "Journal entry",
  checklist: "Checklist",
  chart: "Chart",
  file_created: "File created",
  attention_required: "Attention needed",
  approval_gate: "Approval required",
  question_choice: "Question",
}

export function getCardVisualVariant(type: CardType): CardVisualVariant {
  if (type === "attention_required") return "attention"
  if (type === "approval_gate") return "approval"
  return "neutral"
}

export function getCardTitle(type: CardType, title?: string): string {
  return title?.trim() || CARD_TYPE_LABELS[type]
}
