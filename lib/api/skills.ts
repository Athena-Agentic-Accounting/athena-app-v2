import { backendRequest } from "@/lib/api/backend-client"
import { unwrapList, unwrapRecord } from "@/lib/api/unwrap"

export type ApiSkill = {
  id: string
  name: string
  category?: string
  description?: string
  sourceText?: string
  source_text?: string
  isCustom?: boolean
  is_custom?: boolean
  requiredIntegrations?: string[]
  required_integrations?: string[]
  expectedOutputs?: string[]
  expected_outputs?: string[]
  approvalGates?: string[]
  approval_gates?: string[]
}

export type CreateSkillRequest = {
  name: string
  category: string
  description?: string
  sourceText?: string
  taskSequence?: unknown
  requiredIntegrations?: string[]
  expectedOutputs?: string[]
  approvalGates?: string[]
}

export async function listSkills(token: string | null): Promise<ApiSkill[]> {
  const data = await backendRequest<{ skills?: ApiSkill[] } | ApiSkill[]>(
    "/api/skills",
    { token },
  )

  return unwrapList(data, ["skills"])
}

export async function createSkill(
  token: string | null,
  body: CreateSkillRequest,
): Promise<ApiSkill> {
  const data = await backendRequest<{ skill?: ApiSkill } | ApiSkill>("/api/skills", {
    method: "POST",
    token,
    body,
  })

  return unwrapRecord(data, ["skill"])
}

export async function deleteSkill(token: string | null, skillId: string): Promise<void> {
  await backendRequest(`/api/skills/${encodeURIComponent(skillId)}`, {
    method: "DELETE",
    token,
  })
}

export function isCustomSkill(skill: ApiSkill): boolean {
  return skill.isCustom ?? skill.is_custom ?? false
}
