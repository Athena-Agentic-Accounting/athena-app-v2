import type { JournalEntryLine, JournalEntryReviewData } from "@/lib/genui/types"

// The agent service (athena-ai GATE_TARGET) names gates differently from the
// card renderers; normalize to the frontend's canonical names.
const GATE_TYPE_ALIASES: Record<string, string> = {
  journal_entry_post: "journal_entry",
  transaction_categorize: "transaction_categorization",
}

export function normalizeGateType(gateType: string): string {
  return GATE_TYPE_ALIASES[gateType] ?? gateType
}

export const KNOWN_GATE_TYPES = new Set([
  "journal_entry",
  "transaction_categorization",
  "invoice_create",
  "bill_create",
  "review",
  "plan_review",
])

type QuickBooksJournalLine = {
  Amount?: number
  Description?: string
  JournalEntryLineDetail?: {
    PostingType?: string
    AccountRef?: { value?: string; name?: string }
  }
}

// journal_entry_post gates carry the entry as QuickBooks-format lines in
// pendingAction.args.Line, not in payload.
export function journalEntryFromPendingAction(
  args: Record<string, unknown>,
): JournalEntryReviewData | null {
  const rawLines = args.Line
  if (!Array.isArray(rawLines) || rawLines.length === 0) return null

  const lines: JournalEntryLine[] = rawLines.map((raw) => {
    const line = (raw ?? {}) as QuickBooksJournalLine
    const detail = line.JournalEntryLineDetail
    const account = detail?.AccountRef?.name ?? detail?.AccountRef?.value ?? "Unknown account"
    const amount = typeof line.Amount === "number" ? line.Amount : Number(line.Amount ?? 0)
    return {
      account,
      description: line.Description,
      debit: detail?.PostingType === "Debit" ? amount : undefined,
      credit: detail?.PostingType === "Credit" ? amount : undefined,
    }
  })

  return { date: "", lines }
}
