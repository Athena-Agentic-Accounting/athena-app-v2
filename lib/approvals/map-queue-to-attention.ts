import type { ApprovalQueueItem } from "@/lib/api/approvals"
import {
  resolveApprovalActivityId,
  resolveApprovalActivityName,
  resolveApprovalGateId,
  resolveApprovalGateType,
  resolvePendingAction,
} from "@/lib/api/approvals"
import { journalEntryFromPendingAction, normalizeGateType } from "@/lib/genui/gate-types"
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
  approvalGate?: ApprovalGateCardData
}

function isJournalEntryPayload(
  payload: Record<string, unknown>,
): payload is JournalEntryReviewData {
  return Array.isArray(payload.lines)
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

  if (isJournalEntryPayload(item.payload)) {
    return {
      ...base,
      journalEntry: {
        date: item.payload.date ?? "",
        lines: item.payload.lines,
        memo: item.payload.memo,
        title: item.payload.title,
      },
    }
  }

  if (gateType === "journal_entry") {
    const journalEntry = journalEntryFromPendingAction(pendingAction.args)
    if (journalEntry) {
      return { ...base, journalEntry }
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
