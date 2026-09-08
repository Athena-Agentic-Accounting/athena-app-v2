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
      <table className="font-document w-full min-w-[820px] border-collapse border border-border text-left text-sm">
        <thead className="bg-muted/30">
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
                    "border border-border px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap",
                    isNumeric ? "text-right" : "text-left",
                  )}
                >
                  {column.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const totalRow = isTotalRow(row)

            return (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors",
                  totalRow ? "border-t-2 border-border bg-muted/30 font-medium" : "hover:bg-muted/10",
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
                        "border border-border/70 px-3 py-3 text-sm leading-relaxed text-foreground whitespace-nowrap",
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
