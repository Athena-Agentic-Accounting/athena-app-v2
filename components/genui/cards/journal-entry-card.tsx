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
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse border border-border text-left text-sm">
          <thead className="bg-muted/30">
            <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <th className="w-[50%] min-w-[130px] border border-border px-3 py-2.5 text-left">Account</th>
              <th className="w-[25%] min-w-[85px] border border-border px-3 py-2.5 text-right">Debit</th>
              <th className="w-[25%] min-w-[85px] border border-border px-3 py-2.5 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.account}-${index}`} className="transition-colors hover:bg-muted/10">
                <td className="border border-border/70 px-3 py-2.5 align-top">
                  {editable ? (
                    <input
                      value={line.account}
                      onChange={(event) =>
                        onLineChange?.(index, { account: event.target.value })
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <div>
                      <p className="text-sm font-normal text-foreground">{line.account}</p>
                      {line.description ? (
                        <p className="text-xs text-muted-foreground">{line.description}</p>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="border border-border/70 px-3 py-2.5 text-right font-mono text-sm tabular-nums text-foreground">
                  {editable ? (
                    <input
                      type="number"
                      value={line.debit ?? ""}
                      onChange={(event) =>
                        onLineChange?.(index, {
                          debit: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right font-mono text-sm"
                    />
                  ) : line.debit !== undefined ? (
                    formatCurrency(line.debit)
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border border-border/70 px-3 py-2.5 text-right font-mono text-sm tabular-nums text-foreground">
                  {editable ? (
                    <input
                      type="number"
                      value={line.credit ?? ""}
                      onChange={(event) =>
                        onLineChange?.(index, {
                          credit: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right font-mono text-sm"
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

      <div className="grid border border-t-0 border-border text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Control check
          </p>
          <p
            className={cn(
              "mt-0.5 font-medium",
              balanced
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {balanced
              ? "In balance"
              : `Out of balance · Difference ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
          </p>
        </div>
        <div className="border-t border-border px-3 py-2.5 sm:min-w-32 sm:border-l sm:border-t-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total debits
          </p>
          <p className="mt-0.5 text-right font-mono tabular-nums text-foreground">
            {formatCurrency(totalDebit)}
          </p>
        </div>
        <div className="border-t border-border px-3 py-2.5 sm:min-w-32 sm:border-l sm:border-t-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total credits
          </p>
          <p className="mt-0.5 text-right font-mono tabular-nums text-foreground">
            {formatCurrency(totalCredit)}
          </p>
        </div>
      </div>

      {data.memo ? (
        <div className="border border-t-0 border-border px-3 py-2.5 text-xs">
          <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Memo
          </span>
          <span className="text-foreground/80">{data.memo}</span>
        </div>
      ) : null}
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
