"use client"

import { RiCheckLine, RiListCheck2 } from "@remixicon/react"

import { GenUITable } from "@/components/genui/genui-table"
import { MarkdownContent } from "@/components/session/markdown-content"
import type { TableCardData } from "@/lib/genui/types"

type PlanReviewContentProps = {
  markdown: string
  table?: TableCardData
}

function parsePlanSteps(text: string): { title: string; steps: string[] } | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  // Check if first line is "Proposed Plan" or "# Proposed Plan"
  const firstLine = lines[0].replace(/^#+\s*/, "").trim()
  const isPlanHeading = firstLine.toLowerCase().includes("plan")

  const title = isPlanHeading ? firstLine : "Proposed Execution Plan"
  const rawSteps = isPlanHeading ? lines.slice(1) : lines

  const steps = rawSteps.map((step) =>
    step.replace(/^(\d+[\.\)]\s*|[-*]\s*)/, "").trim(),
  ).filter(Boolean)

  if (steps.length === 0) return null

  return { title, steps }
}

export function PlanReviewContent({ markdown, table }: PlanReviewContentProps) {
  const [beforeTable, afterTable] = splitMarkdownAroundTable(markdown)
  const hasTable = Boolean(table && table.columns.length > 0)
  const planData = parsePlanSteps(beforeTable)

  return (
    <div className="space-y-6">
      {planData ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <header className="mb-4 flex items-center gap-2">
            <RiListCheck2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              {planData.title}
            </h2>
          </header>

          <ol className="space-y-2.5">
            {planData.steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-[11px] font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="pt-0.5 text-sm leading-snug text-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : beforeTable ? (
        <MarkdownContent markdown={beforeTable} />
      ) : null}

      {hasTable && table ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <header className="mb-4">
            <h3 className="text-sm font-medium text-foreground">
              Schedule & Workpaper Preview
            </h3>
            <p className="text-xs text-muted-foreground">
              Prepaid amortizations calculated across active contracts
            </p>
          </header>
          <div className="w-full overflow-x-auto">
            <GenUITable columns={table.columns} rows={table.rows} />
          </div>
        </section>
      ) : null}

      {afterTable ? <MarkdownContent markdown={afterTable} /> : null}
    </div>
  )
}

function splitMarkdownAroundTable(markdown: string): [string, string] {
  const marker = "<!-- table -->"
  if (!markdown.includes(marker)) return [markdown, ""]

  const [before, after] = markdown.split(marker)
  return [before?.trim() ?? "", after?.trim() ?? ""]
}
