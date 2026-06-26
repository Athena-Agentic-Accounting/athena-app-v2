"use client"

import type { TableCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { GenUITable } from "@/components/genui/genui-table"
import { CardShell } from "@/components/genui/card-shell"

export function TableCard({ data }: { data: TableCardData }) {
  return (
    <CardShell type="table" title={getCardTitle("table", data.title)}>
      <GenUITable columns={data.columns} rows={data.rows} />
    </CardShell>
  )
}
