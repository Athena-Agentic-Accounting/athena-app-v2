import { backendRequest, ApiError } from "@/lib/api/backend-client"
import { getApiBaseUrl } from "@/lib/api/config"
import { backendAuthHeaders } from "@/lib/api/headers"

export type ClientMemberRole =
  | "client_manager"
  | "client_reviewer"
  | "client_observer"

export type ApiClient = {
  id: string
  name: string
  integrationHealth?: string
  activityCount?: number
  pendingApprovals?: number
}

export type ApiClientDetail = ApiClient & {
  members?: Array<{
    id: string
    email: string
    role: ClientMemberRole
  }>
  connections?: Array<{
    provider: string
    connected: boolean
  }>
  activities?: Array<{
    id: string
    name: string
    type?: string
    status?: string
  }>
}

export const CLIENT_MEMBER_ROLES: ClientMemberRole[] = [
  "client_manager",
  "client_reviewer",
  "client_observer",
]

export const CLIENT_MEMBER_ROLE_LABELS: Record<ClientMemberRole, string> = {
  client_manager: "Manager",
  client_reviewer: "Reviewer",
  client_observer: "Observer",
}

/** Backend accepts manager/reviewer/observer or client_* variants. */
export function toApiMemberRole(role: ClientMemberRole): string {
  switch (role) {
    case "client_manager":
      return "client_manager"
    case "client_reviewer":
      return "reviewer"
    case "client_observer":
      return "observer"
    default:
      return role
  }
}

export function fromApiMemberRole(role: string): ClientMemberRole {
  switch (role) {
    case "client_manager":
    case "manager":
      return "client_manager"
    case "client_reviewer":
    case "reviewer":
      return "client_reviewer"
    case "client_observer":
    case "observer":
      return "client_observer"
    default:
      return "client_observer"
  }
}

export async function listClients(token: string | null): Promise<ApiClient[]> {
  const data = await backendRequest<{ clients?: ApiClient[] } | ApiClient[]>(
    "/api/clients",
    { token },
  )

  if (Array.isArray(data)) return data
  return data.clients ?? []
}

export async function getClient(
  token: string | null,
  clientId: string,
): Promise<ApiClientDetail> {
  const data = await backendRequest<{ client?: ApiClientDetail } | ApiClientDetail>(
    `/api/clients/${encodeURIComponent(clientId)}`,
    { token },
  )

  if ("client" in data && data.client) return data.client
  return data as ApiClientDetail
}

export async function createClient(
  token: string | null,
  name: string,
  metadata?: Record<string, unknown>,
): Promise<ApiClient> {
  const data = await backendRequest<{ client?: ApiClient } | ApiClient>(
    "/api/clients",
    {
      method: "POST",
      token,
      body: metadata ? { name, metadata } : { name },
    },
  )

  if ("client" in data && data.client) return data.client
  if ("id" in data && "name" in data) return data as ApiClient
  throw new Error("Unexpected response when creating client.")
}

export async function inviteClientMember(
  token: string | null,
  clientId: string,
  email: string,
  role: ClientMemberRole,
): Promise<void> {
  await backendRequest(`/api/clients/${encodeURIComponent(clientId)}/members`, {
    method: "POST",
    token,
    body: { email, role: toApiMemberRole(role) },
  })
}

export async function removeClientMember(
  token: string | null,
  clientId: string,
  memberId: string,
): Promise<void> {
  await backendRequest(
    `/api/clients/${encodeURIComponent(clientId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: "DELETE",
      token,
    },
  )
}

export async function downloadClientAuditExport(
  token: string | null,
  clientId: string,
): Promise<{ blob: Blob; filename: string }> {
  const url = `${getApiBaseUrl()}/api/clients/${encodeURIComponent(clientId)}/audit-export`
  const response = await fetch(url, {
    headers: backendAuthHeaders(token),
  })

  const text = await response.text()
  if (!response.ok) {
    let payload: unknown = text
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      // keep raw text
    }
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed (${response.status})`
    throw new ApiError(message, response.status, payload)
  }

  const disposition = response.headers.get("content-disposition")
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/)
  const filename =
    filenameMatch?.[1] ?? `client-${clientId}-audit-export.json`

  const blob = new Blob([text], {
    type: response.headers.get("content-type") ?? "application/json",
  })

  return { blob, filename }
}
