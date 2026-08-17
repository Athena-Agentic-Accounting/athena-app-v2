"use client"

import { useState } from "react"
import {
  RiDownload2Line,
  RiFileExcel2Line,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WorkpaperSpreadsheetProps = {
  fileName?: string
  clientName?: string
  period?: string
  prepaidRows?: Array<{
    item: string
    vendor: string
    term: string
    originalAmount: number
    julyAmort: number
    endingBalance: number
    opexAccount: string
  }>
  accrualRows?: Array<{
    item: string
    vendor: string
    glAccount: string
    amount: number
    reversalDate: string
    memo: string
  }>
}

const DEFAULT_PREPAID_ROWS = [
  {
    item: "Executive D&O Liability Policy #DO-2026-99",
    vendor: "Travelers Insurance",
    term: "12 (Mar 2026 – Feb 2027)",
    originalAmount: 36000,
    julyAmort: 3000,
    endingBalance: 21000,
    opexAccount: "6100 Insurance Expense",
  },
  {
    item: "Enterprise Monitoring Contract #DD-8821",
    vendor: "Datadog, Inc.",
    term: "24 (Aug 2025 – Jul 2027)",
    originalAmount: 48000,
    julyAmort: 2000,
    endingBalance: 24000,
    opexAccount: "6200 Software & Subscriptions",
  },
]

const DEFAULT_ACCRUAL_ROWS = [
  {
    item: "Unbilled Series B Legal Counsel",
    vendor: "Latham & Watkins LLP",
    glAccount: "6400 Legal & Professional Fees",
    amount: 17500,
    reversalDate: "2026-08-01",
    memo: "Series B term sheet review counsel",
  },
  {
    item: "Unbilled Data Center Power & Bandwidth",
    vendor: "Equinix SV5 Data Center",
    glAccount: "6500 Data Center Utilities",
    amount: 4200,
    reversalDate: "2026-08-01",
    memo: "July colocation power & transit overage",
  },
]

export function WorkpaperSpreadsheet({
  fileName = "Forge_Studios_Prepaids_and_Accruals_July_2026.xlsx",
  clientName = "Forge Studios Inc.",
  period = "July 2026 (07/31/2026)",
  prepaidRows = DEFAULT_PREPAID_ROWS,
  accrualRows = DEFAULT_ACCRUAL_ROWS,
}: WorkpaperSpreadsheetProps) {
  const [activeSheet, setActiveSheet] = useState<"summary" | "prepaids" | "accruals" | "jes">("summary")

  const totalPrepaidOriginal = prepaidRows.reduce((sum, r) => sum + r.originalAmount, 0)
  const totalJulyAmort = prepaidRows.reduce((sum, r) => sum + r.julyAmort, 0)
  const totalEndingPrepaid = prepaidRows.reduce((sum, r) => sum + r.endingBalance, 0)
  const totalAccruals = accrualRows.reduce((sum, r) => sum + r.amount, 0)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs">
      {/* Excel Ribbon & File Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-emerald-700 text-white shadow-2xs">
            <RiFileExcel2Line className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">{fileName}</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-medium text-amber-700">
                Draft · Workpaper
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{clientName} · Period: {period}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs text-foreground"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                "Item,Vendor,GL Account,Amount,Period\n" +
                prepaidRows.map((r) => `"${r.item}","${r.vendor}","${r.opexAccount}",${r.julyAmort},"July 2026"`).join("\n") +
                "\n" +
                accrualRows.map((r) => `"${r.item}","${r.vendor}","${r.glAccount}",${r.amount},"July 2026"`).join("\n")
              const encodedUri = encodeURI(csvContent)
              const link = document.createElement("a")
              link.setAttribute("href", encodedUri)
              link.setAttribute("download", fileName.replace(".xlsx", ".csv"))
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            <RiDownload2Line className="size-3.5" />
            Download .xlsx
          </Button>
        </div>
      </header>

      {/* Spreadsheet Formula Bar */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-1.5 text-xs font-mono text-muted-foreground">
        <span className="font-semibold text-foreground">fx</span>
        <span className="text-[11px] text-muted-foreground">
          {activeSheet === "summary" && `=SUM(Prepaids!E2:E3) + Accruals!D2:D3 → Total July Close Adjustments: ${formatCurrency(totalJulyAmort + totalAccruals)}`}
          {activeSheet === "prepaids" && `=SUM(E2:E${prepaidRows.length + 1}) → Total July Prepaid Amortization: ${formatCurrency(totalJulyAmort)}`}
          {activeSheet === "accruals" && `=SUM(D2:D${accrualRows.length + 1}) → Total Accruals (Reversing 2026-08-01): ${formatCurrency(totalAccruals)}`}
          {activeSheet === "jes" && `=CHECK_BALANCE(Debits, Credits) → Balanced ✓ Debits = Credits`}
        </span>
      </div>

      {/* Sheet Content */}
      <div className="min-h-[300px] overflow-x-auto p-4">
        {activeSheet === "summary" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/80 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Prepaid Assets</p>
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">{formatCurrency(totalEndingPrepaid)}</p>
                <p className="text-[11px] text-muted-foreground">2 Active Contracts</p>
              </div>
              <div className="rounded-lg border border-border/80 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">July 2026 Amortization</p>
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">{formatCurrency(totalJulyAmort)}</p>
                <p className="text-[11px] text-muted-foreground">Non-Reversing Expense</p>
              </div>
              <div className="rounded-lg border border-border/80 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">July 2026 Accruals</p>
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">{formatCurrency(totalAccruals)}</p>
                <p className="text-[11px] text-amber-700">Auto-Reverses 2026-08-01</p>
              </div>
            </div>

            {/* Roll-Forward Summary Table */}
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground">Category / GL Schedule</th>
                    <th className="px-3.5 py-2.5 text-center font-medium uppercase text-muted-foreground">Items</th>
                    <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground">Original Value</th>
                    <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground">July Expense</th>
                    <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground">Ending GL Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[12px]">
                  <tr>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground">1300 Prepaid Expenses</td>
                    <td className="px-3.5 py-2.5 text-center">{prepaidRows.length}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">{formatCurrency(totalPrepaidOriginal)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalJulyAmort)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-foreground">{formatCurrency(totalEndingPrepaid)}</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground">2050 Accrued Liabilities (Auto-Reversing)</td>
                    <td className="px-3.5 py-2.5 text-center">{accrualRows.length}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">—</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalAccruals)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-foreground">{formatCurrency(totalAccruals)}</td>
                  </tr>
                  <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                    <td className="px-3.5 py-2.5 font-sans text-foreground">Total Month-End Adjustments</td>
                    <td className="px-3.5 py-2.5 text-center">{prepaidRows.length + accrualRows.length}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">{formatCurrency(totalPrepaidOriginal)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalJulyAmort + totalAccruals)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalEndingPrepaid + totalAccruals)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSheet === "prepaids" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Contract / Policy</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Vendor</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Term</th>
                  <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground whitespace-nowrap">Original ($)</th>
                  <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground whitespace-nowrap">July Amort ($)</th>
                  <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground whitespace-nowrap">Ending Balance ($)</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Target Opex Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[12px]">
                {prepaidRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground whitespace-nowrap">{r.item}</td>
                    <td className="px-3.5 py-2.5 font-sans text-muted-foreground whitespace-nowrap">{r.vendor}</td>
                    <td className="px-3.5 py-2.5 font-sans text-muted-foreground whitespace-nowrap">{r.term}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">{formatCurrency(r.originalAmount)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{formatCurrency(r.julyAmort)}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">{formatCurrency(r.endingBalance)}</td>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground whitespace-nowrap">{r.opexAccount}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                  <td colSpan={3} className="px-3.5 py-2.5 font-sans text-foreground">Total Prepaid Amortization</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums">{formatCurrency(totalPrepaidOriginal)}</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalJulyAmort)}</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalEndingPrepaid)}</td>
                  <td className="px-3.5 py-2.5 font-sans text-muted-foreground">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSheet === "accruals" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Accrual Item</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Vendor</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Target Expense Account</th>
                  <th className="px-3.5 py-2.5 text-right font-medium uppercase text-muted-foreground whitespace-nowrap">Accrued Amount ($)</th>
                  <th className="px-3.5 py-2.5 text-center font-medium uppercase text-muted-foreground whitespace-nowrap">Reversal Date</th>
                  <th className="px-3.5 py-2.5 font-medium uppercase text-muted-foreground whitespace-nowrap">Memo / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[12px]">
                {accrualRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground whitespace-nowrap">{r.item}</td>
                    <td className="px-3.5 py-2.5 font-sans text-muted-foreground whitespace-nowrap">{r.vendor}</td>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-foreground whitespace-nowrap">{r.glAccount}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{formatCurrency(r.amount)}</td>
                    <td className="px-3.5 py-2.5 text-center font-sans">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        {r.reversalDate}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-sans text-muted-foreground whitespace-nowrap">{r.memo}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                  <td colSpan={3} className="px-3.5 py-2.5 font-sans text-foreground">Total Auto-Reversing Accruals</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(totalAccruals)}</td>
                  <td colSpan={2} className="px-3.5 py-2.5 font-sans text-muted-foreground">Auto-Reverses 2026-08-01</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSheet === "jes" && (
          <div className="space-y-4">
            {/* JE 1 */}
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">JE #1 — July 2026 Monthly Prepaid Amortization (Non-Reversing)</span>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Date: 2026-07-31</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-sans">
                  <tr>
                    <th className="py-1.5">Account</th>
                    <th className="py-1.5 text-right">Debit ($)</th>
                    <th className="py-1.5 text-right">Credit ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[12px]">
                  <tr>
                    <td className="py-1.5 font-sans">6100 Insurance Expense (D&O Policy #DO-2026-99)</td>
                    <td className="py-1.5 text-right tabular-nums">$3,000.00</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans">6200 Software & Subscriptions (Datadog Contract #DD-8821)</td>
                    <td className="py-1.5 text-right tabular-nums">$2,000.00</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans">1300 Prepaid Expenses (Total July Amortization)</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                    <td className="py-1.5 text-right tabular-nums">$5,000.00</td>
                  </tr>
                  <tr className="border-t border-border font-semibold text-foreground">
                    <td className="py-1.5 font-sans">Total Balanced Entry</td>
                    <td className="py-1.5 text-right tabular-nums">$5,000.00</td>
                    <td className="py-1.5 text-right tabular-nums">$5,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* JE 2 */}
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">JE #2 — July 2026 Month-End Expense Accruals</span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">Auto-Reverses 2026-08-01</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-sans">
                  <tr>
                    <th className="py-1.5">Account</th>
                    <th className="py-1.5 text-right">Debit ($)</th>
                    <th className="py-1.5 text-right">Credit ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[12px]">
                  <tr>
                    <td className="py-1.5 font-sans">6400 Legal & Professional Fees (Latham & Watkins Series B Review)</td>
                    <td className="py-1.5 text-right tabular-nums">$17,500.00</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans">6500 Data Center Utilities (Equinix SV5 Power & Transit)</td>
                    <td className="py-1.5 text-right tabular-nums">$4,200.00</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans">2050 Accrued Liabilities (July Expense Accruals)</td>
                    <td className="py-1.5 text-right tabular-nums">—</td>
                    <td className="py-1.5 text-right tabular-nums">$21,700.00</td>
                  </tr>
                  <tr className="border-t border-border font-semibold text-foreground">
                    <td className="py-1.5 font-sans">Total Balanced Entry</td>
                    <td className="py-1.5 text-right tabular-nums">$21,700.00</td>
                    <td className="py-1.5 text-right tabular-nums">$21,700.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Bottom Sheet Tabs */}
      <footer className="flex items-center gap-1 border-t border-border bg-muted/40 px-3 py-1.5">
        {[
          { id: "summary", label: "Summary" },
          { id: "prepaids", label: "Jul 2026 Prepaid Schedule" },
          { id: "accruals", label: "Jul 2026 Accruals Schedule" },
          { id: "jes", label: "Adjusting Journal Entries" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSheet(tab.id as any)}
            className={cn(
              "rounded px-2.5 py-1 text-xs transition-colors",
              activeSheet === tab.id
                ? "bg-background font-medium text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </footer>
    </div>
  )
}
