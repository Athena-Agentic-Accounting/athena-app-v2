"use client"

import type { JournalEntryReviewData } from "@/lib/genui/types"
import { formatCurrency, sumJournalSide } from "@/lib/genui/format"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { cn } from "@/lib/utils"

export function JournalEntryCardBody({
  data,
  editable = false,
  editedLines,
  onLineChange,
}: {
  data: JournalEntryReviewData
  editable?: boolean
  editedLines?: JournalEntryReviewData["lines"]
  onLineChange?: (
    index: number,
    patch: Partial<JournalEntryReviewData["lines"][number]>,
  ) => void
}) {
  const lines = editedLines ?? data.lines
  const totalDebit = sumJournalSide(lines, "debit")
  const totalCredit = sumJournalSide(lines, "credit")
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-muted-foreground">
              <th className="px-2 py-2 text-left font-medium">Account</th>
              <th className="px-2 py-2 text-right font-medium">Debit</th>
              <th className="px-2 py-2 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.account}-${index}`} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-2 align-top">
                  {editable ? (
                    <input
                      value={line.account}
                      onChange={(event) =>
                        onLineChange?.(index, { account: event.target.value })
                      }
                      className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <div>
                      <p className="text-foreground">{line.account}</p>
                      {line.description ? (
                        <p className="text-xs text-muted-foreground">{line.description}</p>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {editable ? (
                    <input
                      type="number"
                      value={line.debit ?? ""}
                      onChange={(event) =>
                        onLineChange?.(index, {
                          debit: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className="w-28 rounded border border-border bg-background px-2 py-1 text-right text-sm"
                    />
                  ) : line.debit !== undefined ? (
                    formatCurrency(line.debit)
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {editable ? (
                    <input
                      type="number"
                      value={line.credit ?? ""}
                      onChange={(event) =>
                        onLineChange?.(index, {
                          credit: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className="w-28 rounded border border-border bg-background px-2 py-1 text-right text-sm"
                    />
                  ) : line.credit !== undefined ? (
                    formatCurrency(line.credit)
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3 text-sm">
        <p className={cn("font-medium", balanced ? "text-emerald-700" : "text-red-700")}>
          {balanced
            ? `Balanced ✓   Total: ${formatCurrency(totalDebit)}`
            : `⚠ Out of balance by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
        </p>
        {data.memo ? <p className="mt-1 text-muted-foreground">Memo: {data.memo}</p> : null}
      </div>
    </>
  )
}

export function JournalEntryCard({ data }: { data: JournalEntryReviewData }) {
  const title = data.title ?? getCardTitle("journal_entry_review", `Journal Entry — ${data.date}`)

  return (
    <CardShell type="journal_entry_review" title={title}>
      <JournalEntryCardBody data={data} />
    </CardShell>
  )
}
