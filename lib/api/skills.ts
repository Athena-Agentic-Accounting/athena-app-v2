import { backendRequest } from "@/lib/api/backend-client"
import { unwrapList, unwrapRecord } from "@/lib/api/unwrap"

export type ApiSkill = {
  id: string
  name: string
  slug?: string
  category?: string
  description?: string
  /** Inlined Markdown body — present on GET /api/skills/:id. */
  content?: string
  contentUrl?: string
  content_url?: string
  clientId?: string | null
  client_id?: string | null
  baseSkillId?: string | null
  base_skill_id?: string | null
  isCore?: boolean
  is_core?: boolean
  isCustom?: boolean
  is_custom?: boolean
  requiredIntegrations?: string[]
  required_integrations?: string[]
}

export type CreateSkillRequest = {
  name: string
  category: string
  description?: string
  content: string
  requiredIntegrations?: string[]
  clientId?: string | null
}

export type UpdateSkillRequest = {
  name?: string
  category?: string
  description?: string
  content: string
  requiredIntegrations?: string[]
  clientId?: string | null
}

export async function listSkills(
  token: string | null,
  clientId?: string | null,
): Promise<ApiSkill[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""
  const data = await backendRequest<{ skills?: ApiSkill[] } | ApiSkill[]>(
    `/api/skills${query}`,
    { token },
  )

  return unwrapList(data, ["skills"])
}

/** Single skill with its Markdown body inlined (`content`). */
export async function getSkill(token: string | null, skillId: string): Promise<ApiSkill> {
  const data = await backendRequest<{ skill?: ApiSkill } | ApiSkill>(
    `/api/skills/${encodeURIComponent(skillId)}`,
    { token },
  )

  return unwrapRecord(data, ["skill"])
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

/**
 * Edit a skill. Editing a core skill forks an org/client override server-side
 * (the returned skill is the new/updated override).
 */
export async function updateSkill(
  token: string | null,
  skillId: string,
  body: UpdateSkillRequest,
): Promise<ApiSkill> {
  const data = await backendRequest<{ skill?: ApiSkill } | ApiSkill>(
    `/api/skills/${encodeURIComponent(skillId)}`,
    {
      method: "PUT",
      token,
      body,
    },
  )

  return unwrapRecord(data, ["skill"])
}

export async function deleteSkill(token: string | null, skillId: string): Promise<void> {
  await backendRequest(`/api/skills/${encodeURIComponent(skillId)}`, {
    method: "DELETE",
    token,
  })
}

export function isCustomSkill(skill: ApiSkill): boolean {
  if (typeof skill.isCore === "boolean") return !skill.isCore
  if (typeof skill.is_core === "boolean") return !skill.is_core
  return skill.isCustom ?? skill.is_custom ?? false
}
