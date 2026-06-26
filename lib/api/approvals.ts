import { backendRequest } from "@/lib/api/backend-client"
import type { ApprovalDecision } from "@/lib/genui/types"
import { unwrapList } from "@/lib/api/unwrap"

export type ApprovalQueueItem = {
  id: string
  gateId?: string
  clientId: string
  client_id?: string
  activityId: string
  activity_id?: string
  activityName?: string
  activity_name?: string
  gateType?: string
  gate_type?: string
  title: string
  status?: string
  payload: Record<string, unknown>
  pendingAction?: {
    target: string
    args: Record<string, unknown>
  }
  pending_action?: {
    target: string
    args: Record<string, unknown>
  }
}

export type ApprovalQueueFilters = {
  clientId?: string | null
  activityId?: string | null
  status?: string
}

export async function getApprovalQueue(
  token: string | null,
  filters?: ApprovalQueueFilters,
): Promise<ApprovalQueueItem[]> {
  const search = new URLSearchParams()
  if (filters?.clientId) search.set("clientId", filters.clientId)
  if (filters?.activityId) search.set("activityId", filters.activityId)
  if (filters?.status) search.set("status", filters.status)
  const query = search.toString() ? `?${search.toString()}` : ""

  const data = await backendRequest<
    { queue?: ApprovalQueueItem[]; items?: ApprovalQueueItem[] } | ApprovalQueueItem[]
  >(`/api/approvals/queue${query}`, { token })

  return unwrapList(data, ["queue", "items", "approvals"])
}

export async function decideApproval(
  token: string | null,
  gateId: string,
  body: {
    decision: ApprovalDecision
    notes?: string
    editedPayload?: Record<string, unknown>
  },
): Promise<void> {
  await backendRequest(`/api/approvals/${encodeURIComponent(gateId)}/decide`, {
    method: "POST",
    token,
    body,
  })
}

export function resolveApprovalGateId(item: ApprovalQueueItem): string {
  return item.gateId ?? item.id
}

export function resolveApprovalActivityId(item: ApprovalQueueItem): string {
  return item.activityId ?? item.activity_id ?? ""
}

export function resolveApprovalClientId(item: ApprovalQueueItem): string {
  return item.clientId ?? item.client_id ?? ""
}

export function resolveApprovalGateType(item: ApprovalQueueItem): string {
  return item.gateType ?? item.gate_type ?? "unknown"
}

export function resolveApprovalActivityName(item: ApprovalQueueItem): string {
  return item.activityName ?? item.activity_name ?? "Activity"
}

export function resolvePendingAction(item: ApprovalQueueItem) {
  return (
    item.pendingAction ??
    item.pending_action ?? {
      target: "unknown",
      args: {},
    }
  )
}
