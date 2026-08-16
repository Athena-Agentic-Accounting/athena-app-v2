import type { ApprovalQueueItem } from "@/lib/api/approvals"
import {
  resolveApprovalActivityId,
  resolveApprovalActivityName,
  resolveApprovalGateId,
  resolveApprovalGateType,
  resolvePendingAction,
} from "@/lib/api/approvals"
import {
  extractJournalEntriesFromPayload,
  journalEntryFromPendingAction,
  normalizeGateType,
} from "@/lib/genui/gate-types"
import type { ApprovalGateCardData, JournalEntryReviewData } from "@/lib/genui/types"

export type HomeAttentionItem = {
  id: string
  activityId: string
  activityTitle: string
  gateId: string
  gateType: string
  title: string
  approveLabel: string
  journalEntry?: JournalEntryReviewData
  journalEntries?: JournalEntryReviewData[]
  approvalGate?: ApprovalGateCardData
}

function defaultApproveLabel(gateType: string): string {
  if (gateType === "journal_entry") return "Post to QuickBooks"
  if (gateType === "plan_review") return "Start now"
  return "Approve"
}

export function mapApprovalQueueItemToAttention(item: ApprovalQueueItem): HomeAttentionItem {
  const gateId = resolveApprovalGateId(item)
  const gateType = normalizeGateType(resolveApprovalGateType(item))
  const activityId = resolveApprovalActivityId(item)
  const pendingAction = resolvePendingAction(item)

  const base: HomeAttentionItem = {
    id: item.id,
    gateId,
    gateType,
    activityId,
    activityTitle: resolveApprovalActivityName(item),
    title: item.title,
    approveLabel: defaultApproveLabel(gateType),
  }

  // Extract any journal entries from payload (single or multiple)
  const payloadEntries = extractJournalEntriesFromPayload(item.payload)
  if (payloadEntries.length > 0) {
    return {
      ...base,
      gateType: "journal_entry",
      journalEntry: payloadEntries[0],
      journalEntries: payloadEntries,
    }
  }

  if (gateType === "journal_entry") {
    const journalEntry = journalEntryFromPendingAction(pendingAction.args)
    if (journalEntry) {
      return { ...base, journalEntry, journalEntries: [journalEntry] }
    }
  }

  return {
    ...base,
    approvalGate: {
      gateId,
      gateType,
      title: item.title,
      payload: item.payload,
      pendingAction,
    },
  }
}

export function mapApprovalQueueToAttention(items: ApprovalQueueItem[]): HomeAttentionItem[] {
  return items.map(mapApprovalQueueItemToAttention)
}

