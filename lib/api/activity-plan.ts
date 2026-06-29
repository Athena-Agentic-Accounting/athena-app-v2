import { agentRequest } from "@/lib/api/agent-client"
import { unwrapRecord } from "@/lib/api/unwrap"

export type AgentPlanApprovalResult = {
  planUrl?: string
  plan_url?: string
}

export async function approveActivityPlanWithAgent(
  token: string | null,
  activityId: string,
): Promise<AgentPlanApprovalResult> {
  const data = await agentRequest<AgentPlanApprovalResult | { plan?: AgentPlanApprovalResult }>(
    `/api/activities/${encodeURIComponent(activityId)}/plan/approve`,
    {
      method: "POST",
      token,
    },
  )

  return unwrapRecord(data, ["plan"])
}
