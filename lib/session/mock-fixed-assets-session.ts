import { DEMO_ACTIVITY_ID } from "@/lib/genui/mock-stream-events"
import { FIXED_ASSETS_TABLE } from "@/lib/genui/fixed-assets-table"
import type { SessionWorkspaceState } from "@/lib/session/types"

const SCHEDULES_MARKDOWN = `# Schedules & Accruals

**Important:** Schedules must reconcile to the GL each period. Do not post depreciation or amortization without a supporting schedule tied to source documents.

This skill builds amortization and depreciation schedules from fixed asset registers, loan terms, and prepaid contracts. It rolls forward prior-month schedules when available, or constructs them from the general ledger when not.

## Core Principle: The Schedule Is the Source of Truth

Every balance sheet schedule (fixed assets, prepaids, deferred revenue, loan amortization) must:

1. Tie to opening balances from the prior period close
2. Reflect all activity during the period (additions, disposals, adjustments)
3. Reconcile ending balances to the GL account balance
4. Produce audit-ready supporting detail

## Inputs and Assumptions

Before building schedules, confirm:

- Prior-month schedule (or GL opening balance if starting fresh)
- Asset register with in-service dates and useful lives
- Prepaid invoices with service periods
- Loan statements with principal/interest splits

When schedules are complete, post journal entries only after reviewer approval.`

const PLAN_MARKDOWN = `# Fixed Assets — April 2026 Close

## Scope

Build the April 2026 fixed asset depreciation schedule, reconcile net book value to the GL, and flag any misclassified capital purchases before posting.

## Current State

<!-- table -->

## Findings

- 4 misclassified items found in expense accounts during GL scan
- No disposals recorded in April
- Truck accumulated depreciation is consistent with straight-line method
- Total NBV of **$61,381.30** ties to the GL fixed asset control account`

export const FIXED_ASSETS_SESSION: SessionWorkspaceState = {
  activityId: DEMO_ACTIVITY_ID,
  showPlanAction: true,
  userMessage: {
    title: "Task title: Fixed Assets — April 2026 close",
    body: "I'm working on the April 2026 close for Jordan's Lawn Care. Please build the fixed asset depreciation schedule for the month. Start by checking whether we have a March 2026 schedule to roll forward.",
  },
  thoughts: [
    { id: "t1", text: "Let me gather context first — client, period, and linked ticket." },
    { id: "t2", text: "Searched memories for prior fixed asset schedules." },
    { id: "t3", text: "Loaded current ticket: Fixed Assets — April 2026 close." },
    { id: "t4", text: "Opened Schedules & Accruals skill for methodology." },
  ],
  artifact: {
    activeTabId: "schedules-and-accruals",
    planTabId: "plan",
    tabs: [
      {
        kind: "document",
        id: "schedules-and-accruals",
        slug: "schedules-and-accruals",
        title: "Schedules & Accruals",
        description:
          "Builds amortization and depreciation schedules from fixed asset registers, loan terms, and prepaid contracts. Rolls forward prior-month schedules or constructs from the GL.",
        markdown: SCHEDULES_MARKDOWN,
      },
      {
        kind: "plan_review",
        id: "plan",
        slug: "plan",
        title: "Plan",
        gateId: "demo-plan-fixed-assets-apr-2026",
        markdown: PLAN_MARKDOWN,
        table: FIXED_ASSETS_TABLE,
      },
    ],
  },
  streamEvents: [
    {
      id: "session-question-1",
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
  ],
}
