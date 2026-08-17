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
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => {
              const isNumeric =
                column.align === "right" ||
                column.format === "currency" ||
                column.format === "accounting"

              return (
                <th
                  key={column.key}
                  className={cn(
                    "px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                    isNumeric ? "text-right" : "text-left",
                  )}
                >
                  {column.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, rowIndex) => {
            const totalRow = isTotalRow(row)

            return (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors",
                  totalRow ? "border-t border-b border-border font-medium bg-muted/20" : "hover:bg-muted/10",
                )}
              >
                {columns.map((column) => {
                  const isNumeric =
                    column.align === "right" ||
                    column.format === "currency" ||
                    column.format === "accounting"

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2.5 text-sm text-foreground",
                        isNumeric ? "text-right font-mono tabular-nums" : "text-left",
                        totalRow && "font-medium text-foreground",
                      )}
                    >
                      {formatCellValue(row[column.key], column.format)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
