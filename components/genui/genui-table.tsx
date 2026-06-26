"use client"

import type { TableColumnDef } from "@/lib/genui/types"
import { formatAccountingCurrency, formatCurrency } from "@/lib/genui/format"
import { isTotalRow } from "@/lib/genui/table-utils"
import { cn } from "@/lib/utils"

type GenUITableProps = {
  columns: TableColumnDef[]
  rows: Record<string, unknown>[]
  className?: string
}

function formatCellValue(value: unknown, format: TableColumnDef["format"] = "text"): string {
  if (value === null || value === undefined || value === "") return ""

  if (typeof value === "string") return value

  if (typeof value === "number") {
    if (format === "accounting") return formatAccountingCurrency(value)
    if (format === "currency") return formatCurrency(value)
    return String(value)
  }

  return String(value)
}

export function GenUITable({ columns, rows, className }: GenUITableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "border border-border/70 bg-muted/45 px-3 py-2.5 text-sm font-normal text-foreground",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const totalRow = isTotalRow(row)

            return (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground",
                      column.align === "right" ? "text-right tabular-nums" : "text-left",
                      totalRow && "font-semibold",
                    )}
                  >
                    {formatCellValue(row[column.key], column.format)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
