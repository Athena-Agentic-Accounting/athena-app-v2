import { backendRequest, ApiError } from "@/lib/api/backend-client"
import { getApiBaseUrl } from "@/lib/api/config"
import { backendAuthHeaders } from "@/lib/api/headers"

export type ClientMemberRole =
  | "client_manager"
  | "client_reviewer"
  | "client_observer"

/** Engine list/detail integration entry — `GET /api/clients`. */
export type ApiClientIntegration = {
  provider: string
  category?: string
  status?: string
  accountEmail?: string
  account_email?: string
  companyId?: string
  company_id?: string
  connectedAt?: string
  connected_at?: string
  lastSyncAt?: string
  last_sync_at?: string
  connected?: boolean
}

export type ApiClientConnection = ApiClientIntegration

export type ApiClientActivityCounts = Record<string, number>

export type ApiClientActivity = {
  id: string
  name: string
  type?: string
  status?: string
  updatedAt?: string
  updated_at?: string
  createdAt?: string
  created_at?: string
  completedAt?: string
  completed_at?: string
}

export type ApiClientConnectorConfig = {
  scopes?: string
  folderId?: string | null
  accountEmail?: string
  tokenExpiresAt?: string
  companyId?: string
}

/** Engine detail connector — `GET /api/clients/:id`. */
export type ApiClientConnector = {
  id: string
  name?: string
  provider: string
  category?: string
  enabled?: boolean
  config?: ApiClientConnectorConfig
}

export type ApiClient = {
  id: string
  name: string
  organizationId?: string
  status?: string
  integrationHealth?: string
  integrations?: ApiClientIntegration[]
  qboConnection?: ApiClientConnection
  driveConnection?: ApiClientConnection
  activityCount?: number
  activityCounts?: ApiClientActivityCounts
  activeActivityCount?: number
  teamCount?: number
  pendingApprovals?: number
}

export type ApiClientDetail = ApiClient & {
  members?: Array<{
    id: string
    email?: string
    email_address?: string
    name?: string
    role: ClientMemberRole | string
  }>
  connectors?: ApiClientConnector[]
  connections?: ApiClientConnection[]
  activities?: ApiClientActivity[]
}

type ApiClientDetailResponse = {
  client: ApiClientDetail
  members?: ApiClientDetail["members"]
  connectors?: ApiClientConnector[]
  connections?: ApiClientConnection[]
  activities?: ApiClientActivity[]
}

const COMPLETED_ACTIVITY_STATUSES = new Set(["completed", "complete"])

function countActiveActivities(activities?: ApiClientActivity[]): number | undefined {
  if (!activities?.length) return undefined
  return activities.filter(
    (activity) => !COMPLETED_ACTIVITY_STATUSES.has((activity.status ?? "").toLowerCase()),
  ).length
}

function normalizeClientDetail(
  data: ApiClientDetailResponse | ApiClientDetail | { client?: ApiClientDetail },
): ApiClientDetail {
  if ("client" in data && data.client) {
    const wrapped = data as ApiClientDetailResponse
    const activeFromActivities = countActiveActivities(wrapped.activities)

    return {
      ...wrapped.client,
      members: wrapped.members ?? [],
      connectors: wrapped.connectors ?? [],
      connections: wrapped.connections ?? wrapped.client.connections,
      activities: wrapped.activities ?? [],
      activeActivityCount:
        wrapped.client.activeActivityCount ??
        activeFromActivities ??
        wrapped.client.activityCount,
      teamCount: wrapped.client.teamCount ?? wrapped.members?.length ?? 0,
    }
  }

  return data as ApiClientDetail
}

export const CLIENT_MEMBER_ROLES: ClientMemberRole[] = [
  "client_manager",
  "client_reviewer",
  "client_observer",
]

export const CLIENT_MEMBER_ROLE_LABELS: Record<ClientMemberRole, string> = {
  client_manager: "Client Manager",
  client_reviewer: "Client Reviewer",
  client_observer: "Client Observer",
}

export function getMemberEmail(member: {
  email?: string | null
  email_address?: string | null
}): string | null {
  const raw = member.email ?? member.email_address
  if (typeof raw !== "string") return null

  const trimmed = raw.trim()
  return trimmed ? trimmed.toLowerCase() : null
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
  const data = await backendRequest<
    ApiClientDetailResponse | ApiClientDetail | { client?: ApiClientDetail }
  >(`/api/clients/${encodeURIComponent(clientId)}`, { token })

  return normalizeClientDetail(data)
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
