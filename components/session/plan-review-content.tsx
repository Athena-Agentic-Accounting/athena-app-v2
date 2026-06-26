"use client"

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
    <div className="space-y-8">
      {beforeTable ? <MarkdownContent markdown={beforeTable} /> : null}
      {hasTable && table ? <GenUITable columns={table.columns} rows={table.rows} /> : null}
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
