import { DEMO_ACTIVITY_ID } from "@/lib/genui/mock-stream-events"
import { FIXED_ASSETS_TABLE } from "@/lib/genui/fixed-assets-table"
import type { SessionWorkspaceState } from "@/lib/session/types"

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

export const PLAN_REVIEW_SESSION: SessionWorkspaceState = {
  activityId: DEMO_ACTIVITY_ID,
  showPlanAction: true,
  userMessage: {
    body: "No prior schedule · No disposals · Build from GL · 4 misclassified items to review",
  },
  thoughts: [
    { id: "t1", text: "Drafted plan from GL scan and prior user answers." },
    { id: "t2", text: "Key highlights:" },
    { id: "t3", text: "4 misclassified items found in expense accounts" },
    { id: "t4", text: "NBV ties to GL control account at $61,381.30" },
    { id: "t5", text: "Ready for your review — reject, schedule, or start now." },
  ],
  artifact: {
    activeTabId: "plan",
    planTabId: "plan",
    tabs: [
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
  streamEvents: [],
}
