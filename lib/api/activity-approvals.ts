import { backendRequest } from "@/lib/api/backend-client"
import type { ApprovalDecision } from "@/lib/genui/types"

export async function decideAgentApproval(
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
