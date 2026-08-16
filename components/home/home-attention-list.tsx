"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  RiArrowDownSLine,
  RiChat1Line,
  RiListCheck2,
} from "@remixicon/react"
import { toast } from "sonner"

import { ApprovalGateCard } from "@/components/genui/cards/approval-gate-card"
import { GenUITable } from "@/components/genui/genui-table"
import { useApprovalQueue } from "@/components/providers/approval-queue-provider"
import { sumJournalSide } from "@/lib/genui/format"
import { markTotalRow } from "@/lib/genui/table-utils"
import type { HomeAttentionItem } from "@/lib/approvals/map-queue-to-attention"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function HomeAttentionList() {
  const { items, isLoading, decide } = useApprovalQueue()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const visibleItems = items

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 px-4 py-8">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  if (visibleItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
        Nothing needs your attention right now.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {visibleItems.map((item, index) => (
        <HomeAttentionExpandableCard
          key={item.id}
          item={item}
          expanded={expandedId === item.id || (expandedId === null && index === 0)}
          submitting={submittingId === item.gateId}
          onToggle={() =>
            setExpandedId((current) => (current === item.id ? null : item.id))
          }
          onApprove={async () => {
            setSubmittingId(item.gateId)
            try {
              await decide(item.gateId, { decision: "approve" })
              toast.success("Approval recorded", {
                description: `${item.approveLabel} for ${item.activityTitle}`,
              })
            } catch (err) {
              toast.error("Could not record approval", {
                description: err instanceof Error ? err.message : "Something went wrong.",
              })
            } finally {
              setSubmittingId(null)
            }
          }}
        />
      ))}
    </div>
  )
}

function HomeAttentionExpandableCard({
  item,
  expanded,
  submitting,
  onToggle,
  onApprove,
}: {
  item: HomeAttentionItem
  expanded: boolean
  submitting: boolean
  onToggle: () => void
  onApprove: () => Promise<void>
}) {
  const entries = useMemo(() => {
    if (item.journalEntries && item.journalEntries.length > 0) {
      return item.journalEntries
    }
    if (item.journalEntry) {
      return [item.journalEntry]
    }
    return []
  }, [item.journalEntries, item.journalEntry])

  async function handleApprove(event: React.MouseEvent) {
    event.stopPropagation()
    await onApprove()
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-xs">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left hover:opacity-80"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.activityTitle}</p>
          </div>

          <RiArrowDownSLine
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>

        <Button
          type="button"
          size="sm"
          className="hidden h-8 shrink-0 bg-emerald-700 px-3 text-xs hover:bg-emerald-800 sm:inline-flex"
          disabled={submitting}
          onClick={handleApprove}
        >
          {submitting ? <Spinner className="size-3.5" /> : item.approveLabel}
        </Button>
      </div>

      {expanded ? (
        <div className="border-t border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Link
                href={`/board?activity=${item.activityId}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <RiListCheck2 className="size-3.5" />
                Agent tasks
              </Link>
              <Link
                href={`/activities/${item.activityId}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <RiChat1Line className="size-3.5" />
                Open in chat
              </Link>
            </div>

            <Button
              type="button"
              size="sm"
              className="h-8 bg-emerald-700 px-3 text-xs hover:bg-emerald-800 sm:hidden"
              disabled={submitting}
              onClick={handleApprove}
            >
              {submitting ? <Spinner className="size-3.5" /> : item.approveLabel}
            </Button>
          </div>

          <div className="space-y-4 px-4 pb-4">
            {entries.length > 0 ? (
              entries.map((entry, idx) => {
                const lines = entry.lines.map((line) => ({
                  account: line.account,
                  debit: line.debit,
                  credit: line.credit,
                  description: line.description ?? "",
                }))

                const totalDebit = sumJournalSide(entry.lines, "debit")
                const totalCredit = sumJournalSide(entry.lines, "credit")
                const rows = [
                  ...lines,
                  markTotalRow({
                    account: "Total",
                    debit: totalDebit,
                    credit: totalCredit,
                    description: "",
                  }),
                ]

                return (
                  <div key={idx} className="rounded-lg border border-border/60 p-3 bg-muted/20">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{entry.memo ?? entry.title ?? `Journal Entry #${idx + 1}`}</span>
                        {entry.date ? (
                          <span className="text-muted-foreground">({entry.date})</span>
                        ) : null}
                      </div>
                      {entry.reversing ? (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 font-normal">
                          Auto-Reverses on {entry.reversalDate ?? "next period"}
                        </span>
                      ) : (
                        <span className="rounded bg-slate-500/10 px-2 py-0.5 text-xs text-muted-foreground font-normal">
                          Non-Reversing
                        </span>
                      )}
                    </div>
                    <GenUITable
                      columns={[
                        { key: "account", label: "Account", format: "text" },
                        { key: "debit", label: "Debit", align: "left", format: "currency" },
                        { key: "credit", label: "Credit", align: "left", format: "currency" },
                        { key: "description", label: "Description", format: "text" },
                      ]}
                      rows={rows}
                    />
                  </div>
                )
              })
            ) : item.approvalGate ? (
              <ApprovalGateCard
                data={item.approvalGate}
                activityId={item.activityId}
                canDecide={false}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}

