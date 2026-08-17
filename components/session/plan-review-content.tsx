"use client"

import {
  RiShieldCheckLine,
  RiTableLine,
  RiBookOpenLine,
  RiScales3Line,
  RiArrowRightLine,
} from "@remixicon/react"

import { GenUITable } from "@/components/genui/genui-table"
import { MarkdownContent } from "@/components/session/markdown-content"
import type { TableCardData } from "@/lib/genui/types"

type PlanReviewContentProps = {
  markdown: string
  table?: TableCardData
}

export function PlanReviewContent({ markdown, table }: PlanReviewContentProps) {
  const [beforeTable, afterTable] = splitMarkdownAroundTable(markdown)
  const hasTable = Boolean(table && table.columns.length > 0)

  return (
    <div className="space-y-6">
      {/* Executive Scope & Workpaper Specification */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiScales3Line className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Month-End Scope & Adjustments Specification
              </h2>
              <p className="text-xs text-muted-foreground">
                Target Period: July 31, 2026 Close · ASC 340-20 Straight-Line
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              4 Accounts
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              2 Reversals
            </span>
          </div>
        </header>

        {/* Scope Accounts Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
              <span>Prepaid Insurance (D&O Policy)</span>
              <span className="font-mono text-emerald-600">$3,000.00/mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              1300 Prepaid Expenses <RiArrowRightLine className="inline size-3 mx-0.5" /> 6100 Insurance Expense
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
              <span>Datadog SaaS Amortization</span>
              <span className="font-mono text-emerald-600">$2,000.00/mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              1310 Prepaid Software <RiArrowRightLine className="inline size-3 mx-0.5" /> 6200 Software & Subscriptions
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
              <span>Legal Services Accrual</span>
              <span className="font-mono text-amber-600">$17,500.00</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              6400 Legal Expense <RiArrowRightLine className="inline size-3 mx-0.5" /> 2050 Accrued Expenses (Auto-Reverse)
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
              <span>Utilities & Facilities Accrual</span>
              <span className="font-mono text-amber-600">$4,200.00</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              6500 Utilities Expense <RiArrowRightLine className="inline size-3 mx-0.5" /> 2050 Accrued Expenses (Auto-Reverse)
            </p>
          </div>
        </div>
      </section>

      {/* Schedule Table Preview & Workpaper Grid */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <RiTableLine className="size-4 text-primary" />
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Amortization & Accrual Workpaper Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                Calculated straight-line expense schedules and auto-reversing accruals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              Total Adjustments: $26,700.00
            </span>
          </div>
        </header>

        <div className="w-full overflow-x-auto rounded-lg border border-border">
          {hasTable && table ? (
            <GenUITable columns={table.columns} rows={table.rows} />
          ) : (
            <GenUITable
              columns={[
                { key: "ref", label: "Reference / Contract" },
                { key: "account", label: "GL Mapping" },
                { key: "term", label: "Term" },
                { key: "gross", label: "Gross Value" },
                { key: "adj", label: "July 31 Adj" },
                { key: "reversal", label: "Reversal Policy" },
              ]}
              rows={[
                {
                  ref: "D&O Liability Policy (#DO-2026-99)",
                  account: "1300 → 6100 Insurance",
                  term: "12 mo",
                  gross: "$36,000.00",
                  adj: "$3,000.00",
                  reversal: "Non-Reversing",
                },
                {
                  ref: "Datadog SaaS Platform (#DD-SaaS-24)",
                  account: "1310 → 6200 Software",
                  term: "24 mo",
                  gross: "$48,000.00",
                  adj: "$2,000.00",
                  reversal: "Non-Reversing",
                },
                {
                  ref: "Latham & Watkins Legal Fees",
                  account: "6400 → 2050 Accrued",
                  term: "Unbilled",
                  gross: "—",
                  adj: "$17,500.00",
                  reversal: "2026-08-01 (Auto)",
                },
                {
                  ref: "Equinix SV5 Colocation Utilities",
                  account: "6500 → 2050 Accrued",
                  term: "Unbilled",
                  gross: "—",
                  adj: "$4,200.00",
                  reversal: "2026-08-01 (Auto)",
                },
              ]}
            />
          )}
        </div>
      </section>

      {/* Narrative Context or Footnotes */}
      {afterTable ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <header className="mb-3 flex items-center gap-2">
            <RiBookOpenLine className="size-4 text-muted-foreground" />
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Accounting Policy Notes & Controls
            </h4>
          </header>
          <MarkdownContent markdown={afterTable} />
        </section>
      ) : null}
    </div>
  )
}

function splitMarkdownAroundTable(markdown: string): [string, string] {
  const marker = "<!-- table -->"
  if (!markdown.includes(marker)) return [markdown, ""]

  const [before, after] = markdown.split(marker)
  return [before?.trim() ?? "", after?.trim() ?? ""]
}
