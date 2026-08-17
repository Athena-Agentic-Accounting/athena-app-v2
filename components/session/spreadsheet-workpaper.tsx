"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import {
  RiDownloadLine,
  RiSaveLine,
  RiFileLine,
  RiCheckLine,
  RiCloseLine,
  RiAddLine,
  RiArrowRightLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type SheetTab = "prepaid_schedule" | "amort_je" | "accrual_schedule"

export function SpreadsheetWorkpaper({
  fileName = "ForgeStudios_Jul2026_MonthEnd_Workpaper.xlsx",
  onClose,
}: {
  fileName?: string
  onClose?: () => void
}) {
  const [activeSheet, setActiveSheet] = useState<SheetTab>("prepaid_schedule")
  const [selectedCell, setSelectedCell] = useState("A1")
  const [activeMenu, setActiveMenu] = useState("Home")

  const menus = ["Home", "Insert", "Page Layout", "Formulas", "Review", "View", "Settings"]

  function handleDownloadXLSX() {
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1: Prepaid Schedule
      const prepaidData = [
        ["Forge Studios Inc."],
        ["Prepaid Expense Amortization Schedule - July 2026"],
        ["Period ending 2026-07-31 | Status: DRAFT - pending review, not posted to any ERP"],
        [],
        ["Journal date", "Transaction type", "Vendor", "Description/Policy #", "Prepaid GL account", "Expense GL account"],
        ["2026-07-31", "Prepaid amortization", "Chubb", "D&O Insurance Policy #DO-2026-99", "1300 Prepaid Expenses", "6100 Insurance Expense"],
        ["2026-07-31", "Prepaid amortization", "Datadog", "Datadog SaaS #DD-8821", "1300 Prepaid Expenses", "6200 Software Expense"],
        [],
        ["Summary by expense GL account"],
        ["Expense GL account", "Count", "Original total", "This month's charge", "Accumulated amortization", "Remaining balance"],
        ["6100 Insurance Expense", 1, 36000, 3000, 15000, 21000],
        ["6200 Software & Subscriptions", 1, 48000, 2000, 24000, 24000],
        ["Grand total", 2, 84000, 5000, 39000, 45000],
        [],
        ["GL reconciliation - account 1300 Prepaid Expenses"],
        ["Prior-month balance", 50000],
        ["Add: additions", 0],
        ["Less: July 2026 charge", -5000],
        ["Computed July 31 balance", 45000]
      ]
      const ws1 = XLSX.utils.aoa_to_sheet(prepaidData)
      XLSX.utils.book_append_sheet(wb, ws1, "Jul 2026 Prepaid Schedule")

      // Sheet 2: Journal Entries
      const jeData = [
        ["Standard Journal Entry Batch — July 31, 2026"],
        ["JE Ref", "Effective Date", "GL Account & Name", "Debit", "Credit"],
        ["JE-2026-07-001", "2026-07-31", "6100 Insurance Expense", 3000, 0],
        ["JE-2026-07-001", "2026-07-31", "6200 Software Expense", 2000, 0],
        ["JE-2026-07-001", "2026-07-31", "1300 Prepaid Expenses", 0, 5000],
        ["JE-2026-07-002", "2026-07-31", "6400 Legal Expense", 17500, 0],
        ["JE-2026-07-002", "2026-07-31", "6500 Utilities Expense", 4200, 0],
        ["JE-2026-07-002", "2026-07-31", "2050 Accrued Liabilities", 0, 21700],
        ["JE-2026-08-001", "2026-08-01", "2050 Accrued Liabilities", 21700, 0],
        ["JE-2026-08-001", "2026-08-01", "6400 Legal Expense", 0, 17500],
        ["JE-2026-08-001", "2026-08-01", "6500 Utilities Expense", 0, 4200]
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(jeData)
      XLSX.utils.book_append_sheet(wb, ws2, "Jul 2026 Amort JE")

      // Sheet 3: Accruals
      const accrualData = [
        ["Unbilled Month-End Accruals & Auto-Reversals — July 31, 2026"],
        ["Accrual Item", "Expense GL", "Liability GL", "Amount", "Reversal Date", "Status"],
        ["Latham & Watkins LLP Legal Fees", "6400 Legal & Prof. Fees", "2050 Accrued Liabilities", 17500, "2026-08-01", "Auto-Reversing"],
        ["Equinix SV5 Data Center Utilities", "6500 Data Center & Hosting", "2050 Accrued Liabilities", 4200, "2026-08-01", "Auto-Reversing"]
      ]
      const ws3 = XLSX.utils.aoa_to_sheet(accrualData)
      XLSX.utils.book_append_sheet(wb, ws3, "Jul 2026 Accrual Schedule")

      XLSX.writeFile(wb, fileName)
      toast.success(`Exported real Excel workbook: ${fileName}`)
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate Excel export")
    }
  }

  return (
    <div className="flex h-full flex-col bg-background font-sans text-xs select-none">
      {/* Excel File Header Tab Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-foreground shadow-xs">
            <span className="flex size-3.5 items-center justify-center rounded-xs bg-emerald-600 font-bold text-[9px] text-white">
              X
            </span>
            <span className="truncate font-medium">{fileName}</span>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="size-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => toast.success("New blank sheet tab added")}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <RiAddLine className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            ✓ Formatted & Balanced
          </span>
        </div>
      </div>

      {/* Ribbon Menu Bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-border/80 bg-background px-4 py-1 text-[11px] text-muted-foreground">
        {menus.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActiveMenu(m)}
            className={cn(
              "py-0.5 transition-colors",
              activeMenu === m
                ? "border-b-2 border-emerald-600 font-medium text-foreground"
                : "hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Formula Bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-1 text-[11px]">
        <span className="w-10 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-center font-mono font-medium text-foreground">
          {selectedCell}
        </span>
        <span className="font-mono italic text-muted-foreground/60">fx</span>
        <div className="flex-1 rounded border border-border/60 bg-muted/10 px-2 py-0.5 font-mono text-foreground">
          {selectedCell === "A1" ? "Forge Studios Inc." : "=SUM(D6:D7)"}
        </div>
      </div>

      {/* Excel Sheet Grid */}
      <div className="flex-1 overflow-auto bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {activeSheet === "prepaid_schedule" && (
          <div className="min-w-[720px] font-sans text-[11px]">
            {/* Sheet Title Header block */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
              <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Forge Studios Inc.</h1>
              <h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Prepaid Expense Amortization Schedule - July 2026
              </h2>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Period ending 2026-07-31 | Status: DRAFT - pending review, not posted to any ERP
              </p>
            </div>

            {/* Table Section 1: Itemized Contracts */}
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-sky-100/70 dark:bg-sky-950/40 text-neutral-800 dark:text-neutral-200 border-y border-neutral-300 dark:border-neutral-700 font-semibold text-[10.5px]">
                  <th className="w-8 border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-center text-neutral-400">#</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Journal date</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Transaction type</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Vendor</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Description/Policy #</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Prepaid GL account</th>
                  <th className="px-2 py-1.5">Expense GL account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr className="hover:bg-sky-50/50 dark:hover:bg-neutral-900/50">
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">6</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1">2026-07-31</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Prepaid amortization</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Chubb</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">D&O Insurance Policy #DO-2026-99</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1">1300 Prepaid Expenses</td>
                  <td className="px-2 py-1">6100 Insurance Expense</td>
                </tr>
                <tr className="hover:bg-sky-50/50 dark:hover:bg-neutral-900/50">
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">7</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1">2026-07-31</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Prepaid amortization</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Datadog</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Datadog SaaS #DD-8821</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1">1300 Prepaid Expenses</td>
                  <td className="px-2 py-1">6200 Software Expense</td>
                </tr>
                <tr className="bg-neutral-100/50 dark:bg-neutral-900/60 font-bold border-t border-b-2 border-neutral-300 dark:border-neutral-700">
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">8</td>
                  <td colSpan={5} className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Total Amortization Entries</td>
                  <td className="px-2 py-1 font-mono text-emerald-600">2 Active Schedules</td>
                </tr>
              </tbody>
            </table>

            {/* Table Section 2: Summary by Expense GL Account */}
            <div className="mt-4 px-3 py-1 font-bold text-neutral-800 dark:text-neutral-200 text-[11px]">
              Summary by expense GL account
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-sky-100/70 dark:bg-sky-950/40 text-neutral-800 dark:text-neutral-200 border-y border-neutral-300 dark:border-neutral-700 font-semibold text-[10.5px]">
                  <th className="w-8 border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-center text-neutral-400">#</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5">Expense GL account</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-right">Count</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-right">Original total</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-right">This month&apos;s charge</th>
                  <th className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-right">Accumulated amortization</th>
                  <th className="px-2 py-1.5 text-right">Remaining balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">12</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">6100 Insurance Expense</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">1</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$36,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right font-semibold text-emerald-600">$3,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$15,000.00</td>
                  <td className="px-2 py-1 text-right">$21,000.00</td>
                </tr>
                <tr>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">13</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">6200 Software & Subscriptions</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">1</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$48,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right font-semibold text-emerald-600">$2,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$24,000.00</td>
                  <td className="px-2 py-1 text-right">$24,000.00</td>
                </tr>
                <tr className="bg-neutral-100/50 dark:bg-neutral-900/60 font-bold border-t border-b-2 border-neutral-300 dark:border-neutral-700">
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">14</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 font-sans">Grand total</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">2</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$84,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right text-emerald-600">$5,000.00</td>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-right">$39,000.00</td>
                  <td className="px-2 py-1 text-right">$45,000.00</td>
                </tr>
              </tbody>
            </table>

            {/* Table Section 3: GL Reconciliation */}
            <div className="mt-4 px-3 py-1 font-bold text-neutral-800 dark:text-neutral-200 text-[11px]">
              GL reconciliation - account 1300 Prepaid Expenses
            </div>
            <table className="w-full max-w-md border-collapse text-left">
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-[10.5px]">
                <tr>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400 w-8">17</td>
                  <td className="px-2 py-1 font-sans">Prior-month balance</td>
                  <td className="px-2 py-1 text-right">$50,000.00</td>
                </tr>
                <tr>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">18</td>
                  <td className="px-2 py-1 font-sans">Add: additions</td>
                  <td className="px-2 py-1 text-right">—</td>
                </tr>
                <tr>
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">19</td>
                  <td className="px-2 py-1 font-sans">Less: July 2026 charge</td>
                  <td className="px-2 py-1 text-right text-red-600">($5,000.00)</td>
                </tr>
                <tr className="bg-neutral-100/50 dark:bg-neutral-900/60 font-bold border-t border-b-2 border-neutral-300 dark:border-neutral-700">
                  <td className="border-r border-neutral-200 dark:border-neutral-800 px-2 py-1 text-center text-neutral-400">20</td>
                  <td className="px-2 py-1 font-sans">Computed July 31 balance</td>
                  <td className="px-2 py-1 text-right text-emerald-600">$45,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSheet === "accrual_schedule" && (
          <div className="min-w-[720px] font-sans text-[11px] p-3">
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">
              <h1 className="text-sm font-bold">Unbilled Month-End Accruals & Auto-Reversals</h1>
              <p className="text-xs text-muted-foreground">July 31, 2026 Accrual with 2026-08-01 Reversal Policy</p>
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-amber-100/60 dark:bg-amber-950/40 text-neutral-800 dark:text-neutral-200 border-y border-neutral-300 dark:border-neutral-700 font-semibold">
                  <th className="px-2 py-1.5">Accrual Item</th>
                  <th className="px-2 py-1.5">Expense GL</th>
                  <th className="px-2 py-1.5">Liability GL</th>
                  <th className="px-2 py-1.5 text-right">Amount</th>
                  <th className="px-2 py-1.5">Reversal Date</th>
                  <th className="px-2 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="px-2 py-1.5 font-sans font-medium">Latham & Watkins LLP Legal Fees</td>
                  <td className="px-2 py-1.5">6400 Legal & Prof. Fees</td>
                  <td className="px-2 py-1.5">2050 Accrued Liabilities</td>
                  <td className="px-2 py-1.5 text-right font-bold text-amber-600">$17,500.00</td>
                  <td className="px-2 py-1.5">2026-08-01</td>
                  <td className="px-2 py-1.5 font-sans text-emerald-600">✓ Auto-Reversing</td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5 font-sans font-medium">Equinix SV5 Data Center Utilities</td>
                  <td className="px-2 py-1.5">6500 Data Center & Hosting</td>
                  <td className="px-2 py-1.5">2050 Accrued Liabilities</td>
                  <td className="px-2 py-1.5 text-right font-bold text-amber-600">$4,200.00</td>
                  <td className="px-2 py-1.5">2026-08-01</td>
                  <td className="px-2 py-1.5 font-sans text-emerald-600">✓ Auto-Reversing</td>
                </tr>
                <tr className="bg-neutral-100/50 dark:bg-neutral-900/60 font-bold border-t border-b-2 border-neutral-300 dark:border-neutral-700">
                  <td colSpan={3} className="px-2 py-1.5 font-sans">Total Accrued Expenses</td>
                  <td className="px-2 py-1.5 text-right text-amber-600">$21,700.00</td>
                  <td colSpan={2} className="px-2 py-1.5 font-sans text-muted-foreground">Reverses next period</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSheet === "amort_je" && (
          <div className="min-w-[720px] font-sans text-[11px] p-3">
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">
              <h1 className="text-sm font-bold">Standard Journal Entry Batch — July 31, 2026</h1>
              <p className="text-xs text-muted-foreground">Balanced double-entry journal lines ready for ERP export</p>
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-emerald-100/60 dark:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 border-y border-neutral-300 dark:border-neutral-700 font-semibold">
                  <th className="px-2 py-1.5">JE Ref</th>
                  <th className="px-2 py-1.5">Effective Date</th>
                  <th className="px-2 py-1.5">GL Account & Name</th>
                  <th className="px-2 py-1.5 text-right">Debit</th>
                  <th className="px-2 py-1.5 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="px-2 py-1">JE-2026-07-001</td>
                  <td className="px-2 py-1">2026-07-31</td>
                  <td className="px-2 py-1 font-sans">6100 Insurance Expense</td>
                  <td className="px-2 py-1 text-right">$3,000.00</td>
                  <td className="px-2 py-1 text-right">$0.00</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">JE-2026-07-001</td>
                  <td className="px-2 py-1">2026-07-31</td>
                  <td className="px-2 py-1 font-sans">6200 Software Expense</td>
                  <td className="px-2 py-1 text-right">$2,000.00</td>
                  <td className="px-2 py-1 text-right">$0.00</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">JE-2026-07-001</td>
                  <td className="px-2 py-1">2026-07-31</td>
                  <td className="px-2 py-1 font-sans">1300 Prepaid Expenses</td>
                  <td className="px-2 py-1 text-right">$0.00</td>
                  <td className="px-2 py-1 text-right">$5,000.00</td>
                </tr>
                <tr className="bg-neutral-100/50 dark:bg-neutral-900/60 font-bold border-t border-b-2 border-neutral-300 dark:border-neutral-700">
                  <td colSpan={3} className="px-2 py-1 font-sans">JE-001 Balanced Total</td>
                  <td className="px-2 py-1 text-right text-emerald-600">$5,000.00</td>
                  <td className="px-2 py-1 text-right text-emerald-600">$5,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sheet Tabs & Excel Actions Footer */}
      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSheet("prepaid_schedule")}
            className={cn(
              "rounded-t border-t-2 px-3 py-1 text-[11px] font-medium transition-colors",
              activeSheet === "prepaid_schedule"
                ? "border-emerald-600 bg-background text-foreground shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Jul 2026 Prepaid Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet("amort_je")}
            className={cn(
              "rounded-t border-t-2 px-3 py-1 text-[11px] font-medium transition-colors",
              activeSheet === "amort_je"
                ? "border-emerald-600 bg-background text-foreground shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Jul 2026 Amort JE
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet("accrual_schedule")}
            className={cn(
              "rounded-t border-t-2 px-3 py-1 text-[11px] font-medium transition-colors",
              activeSheet === "accrual_schedule"
                ? "border-emerald-600 bg-background text-foreground shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Jul 2026 Accrual Schedule
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success("Workpaper saved to Athena cloud storage")}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RiSaveLine className="size-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={handleDownloadXLSX}
            className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
          >
            <RiDownloadLine className="size-3.5" />
            Download .xlsx
          </button>
        </div>
      </footer>
    </div>
  )
}
