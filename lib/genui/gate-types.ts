import type { JournalEntryLine, JournalEntryReviewData } from "@/lib/genui/types"

// The agent service (athena-ai GATE_TARGET) names gates differently from the
// card renderers; normalize to the frontend's canonical names.
const GATE_TYPE_ALIASES: Record<string, string> = {
  journal_entry_post: "journal_entry",
  "qbo.post_journal_entry": "journal_entry",
  "quickbooks.journal_entry.create": "journal_entry",
  "quickbooks.post_journal_entry": "journal_entry",
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

export function extractJournalEntriesFromPayload(
  payload: Record<string, unknown>,
): JournalEntryReviewData[] {
  if (!payload || typeof payload !== "object") return []

  // Check if payload has an array of entries
  if (Array.isArray(payload.entries) && payload.entries.length > 0) {
    return payload.entries
      .filter((e) => e && typeof e === "object" && Array.isArray((e as any).lines))
      .map((e: any) => ({
        date: typeof e.date === "string" ? e.date : "",
        memo: typeof e.memo === "string" ? e.memo : undefined,
        title: typeof e.title === "string" ? e.title : undefined,
        reversing: typeof e.reversing === "boolean" ? e.reversing : undefined,
        reversalDate: typeof e.reversalDate === "string" ? e.reversalDate : undefined,
        lines: (e.lines as any[]).map((l: any) => ({
          account: String(l.account ?? "Unknown Account"),
          debit: typeof l.debit === "number" ? l.debit : (l.debit ? Number(l.debit) : undefined),
          credit: typeof l.credit === "number" ? l.credit : (l.credit ? Number(l.credit) : undefined),
          description: typeof l.description === "string" ? l.description : undefined,
        })),
      }))
  }

  // Check if payload itself is a single journal entry with lines
  if (Array.isArray(payload.lines) && payload.lines.length > 0) {
    return [
      {
        date: typeof payload.date === "string" ? payload.date : "",
        memo: typeof payload.memo === "string" ? payload.memo : undefined,
        title: typeof payload.title === "string" ? payload.title : undefined,
        reversing: typeof payload.reversing === "boolean" ? payload.reversing : undefined,
        reversalDate: typeof payload.reversalDate === "string" ? payload.reversalDate : undefined,
        lines: (payload.lines as any[]).map((l: any) => ({
          account: String(l.account ?? "Unknown Account"),
          debit: typeof l.debit === "number" ? l.debit : (l.debit ? Number(l.debit) : undefined),
          credit: typeof l.credit === "number" ? l.credit : (l.credit ? Number(l.credit) : undefined),
          description: typeof l.description === "string" ? l.description : undefined,
        })),
      },
    ]
  }

  return []
}

// journal_entry_post gates carry the entry as QuickBooks-format lines in
// pendingAction.args.Line, not in payload.
export function journalEntryFromPendingAction(
  args: Record<string, unknown>,
): JournalEntryReviewData | null {
  if (!args || typeof args !== "object") return null

  // Check for Athena canonical entries in pendingAction
  const extracted = extractJournalEntriesFromPayload(args)
  if (extracted.length > 0) return extracted[0]

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

