import { FIXED_ASSETS_TABLE } from "@/lib/genui/fixed-assets-table"
import type { ActivityStreamEvent } from "@/lib/genui/types"

export const DEMO_ACTIVITY_ID = "demo-activity-oct-close"

export const DEMO_STREAM_EVENTS: ActivityStreamEvent[] = [
  {
    id: "evt-1",
    activityId: DEMO_ACTIVITY_ID,
    timestamp: "2024-10-31T09:00:00Z",
    event: {
      type: "progress",
      data: {
        stepDescription: "Reconciling bank transactions...",
        stepIndex: 4,
        percent: 44,
        title: "Step 4 of 9",
      },
    },
  },
  {
    id: "evt-2",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "narrative",
      data: {
        title: "Variance commentary",
        markdown: `### October close update

Cash is **$42k higher** than forecast, driven by two late customer payments.

- AR ageing improved in the 31–60 bucket
- Payroll accrual still pending client confirmation`,
      },
    },
  },
  {
    id: "evt-2b",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "question_choice",
      data: {
        question:
          "Do you have a prior-month (March 2026) fixed asset / depreciation schedule to roll forward?",
        description:
          "This determines whether I build the schedule from scratch using the GL or roll forward an existing schedule. If you have one, please upload it.",
        stepIndex: 1,
        stepCount: 2,
        options: [
          { id: "upload-now", label: "I'll upload it now" },
          { id: "no-schedule", label: "No prior schedule" },
          { id: "need-help", label: "Need help finding it" },
          { id: "other", label: "Other" },
        ],
        selectedOptionId: "upload-now",
        allowSkip: true,
      },
    },
  },
  {
    id: "evt-3",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "table",
      data: {
        title: "Bank reconciliation exceptions",
        columns: [
          { key: "date", label: "Date", format: "text" },
          { key: "description", label: "Description", format: "text" },
          { key: "amount", label: "Amount", align: "left", format: "currency" },
          { key: "status", label: "Status", format: "text" },
        ],
        rows: [
          {
            date: "Oct 12",
            description: "Unknown ACH debit",
            amount: 3200,
            status: "Unmatched",
          },
          {
            date: "Oct 18",
            description: "Stripe payout duplicate",
            amount: 18450,
            status: "Possible duplicate",
          },
          {
            date: "Oct 22",
            description: "Wire from Apex Holdings",
            amount: 98000,
            status: "Matched",
          },
        ],
      },
    },
  },
  {
    id: "evt-3b",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "table",
      data: {
        title: "Fixed asset register summary",
        ...FIXED_ASSETS_TABLE,
      },
    },
  },
  {
    id: "evt-4",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "table",
      data: {
        title: "AR ageing summary",
        columns: [
          { key: "bucket", label: "Bucket", format: "text" },
          { key: "count", label: "Invoices", format: "text" },
          { key: "balance", label: "Balance", align: "left", format: "currency" },
        ],
        rows: [
          { bucket: "Current", count: 18, balance: 128400 },
          { bucket: "31–60", count: 6, balance: 45200 },
          { bucket: "61–90", count: 2, balance: 9800 },
          { bucket: "90+", count: 1, balance: 3200 },
        ],
      },
    },
  },
  {
    id: "evt-5",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "journal_entry_review",
      data: {
        date: "Oct 31, 2024",
        title: "Journal Entry — Oct 31, 2024",
        lines: [
          {
            account: "Cash — Chase 9941",
            debit: 2847392.14,
          },
          {
            account: "AR — Trade",
            credit: 2847392.14,
          },
        ],
        memo: "Reconciliation close for October",
      },
    },
  },
  {
    id: "evt-6",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "checklist",
      data: {
        title: "PBC Checklist",
        items: [
          { label: "Bank statements — Oct 2024", done: true },
          { label: "Trial balance", done: true },
          {
            label: "Fixed asset register",
            done: false,
            detail: "Awaiting client upload",
          },
        ],
      },
    },
  },
  {
    id: "evt-7",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "chart",
      data: {
        title: "Revenue vs forecast",
        chartType: "bar",
        labels: ["Jul", "Aug", "Sep", "Oct"],
        series: [
          { name: "Actual", values: [420, 455, 470, 512] },
          { name: "Forecast", values: [410, 440, 465, 470] },
        ],
      },
    },
  },
  {
    id: "evt-8",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "file_created",
      data: {
        fileName: "Reconciliation_Workpaper_Oct2024.xlsx",
        fileUrl: "https://drive.google.com",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        location: "FinFlow Ltd / Workpapers",
      },
    },
  },
  {
    id: "evt-9",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "attention_required",
      data: {
        reason: "Two transactions could not be matched",
        detail:
          "An unknown ACH debit for $3,200 has no corresponding GL entry, and a Stripe payout appears twice in the bank feed.",
      },
    },
  },
  {
    id: "evt-10",
    activityId: DEMO_ACTIVITY_ID,
    event: {
      type: "approval_gate",
      data: {
        gateId: "demo-gate-journal-entry",
        gateType: "journal_entry",
        title: "Post journal entry",
        payload: {
          date: "Oct 31, 2024",
          lines: [
            { account: "Cash — Chase 9941", debit: 3200 },
            { account: "Suspense — Unmatched bank", credit: 3200 },
          ],
          memo: "Clear unmatched ACH from Oct 12",
        },
        pendingAction: {
          target: "quickbooks.journal_entry.create",
          args: {},
        },
      },
    },
  },
]

export const DEMO_DECIDED_APPROVAL: ActivityStreamEvent = {
  id: "evt-11",
  activityId: DEMO_ACTIVITY_ID,
  event: {
    type: "approval_gate",
    data: {
      gateId: "demo-gate-decided",
      gateType: "journal_entry",
      title: "Post payroll accrual",
      payload: {
        date: "Oct 31, 2024",
        lines: [{ account: "Payroll expense", debit: 12000 }, { account: "Accrued payroll", credit: 12000 }],
      },
      pendingAction: { target: "quickbooks.journal_entry.create", args: {} },
    },
  },
}
