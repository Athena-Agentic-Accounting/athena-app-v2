import type {
  ApiClient,
  ApiClientConnection,
  ApiClientConnector,
  ApiClientDetail,
  ApiClientIntegration,
} from "@/lib/api/clients"
import { normalizeIntegrationProvider } from "@/lib/clients/integration-display"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"

export type ConnectionStatus = "connected" | "reauth_needed" | "not_connected"

export type ClientConnection = {
  status: ConnectionStatus
  accountEmail?: string
  companyId?: string
  connectedAt?: string
  lastSyncAt?: string
  tokenExpiresAt?: string
}

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Connected",
  reauth_needed: "Reauth needed",
  not_connected: "Not connected",
}

const COMPLETED_ACTIVITY_STATUSES = new Set(["completed", "complete"])

function parseConnectionStatus(raw?: string | null, connected?: boolean): ConnectionStatus {
  if (!raw && connected === false) return "not_connected"
  if (!raw && connected === true) return "connected"

  const value = (raw ?? "").toLowerCase()
  if (
    value === "connected" ||
    value === "healthy" ||
    value === "ok" ||
    value === "active" ||
    value.includes("connected")
  ) {
    return "connected"
  }
  if (
    value === "reauth_needed" ||
    value === "reauth" ||
    value.includes("reauth") ||
    value.includes("expired") ||
    value.includes("warning") ||
    value.includes("partial") ||
    value.includes("pending")
  ) {
    return "reauth_needed"
  }
  if (
    value === "not_connected" ||
    value === "disconnected" ||
    value.includes("disconnect") ||
    value.includes("failed") ||
    value.includes("error")
  ) {
    return "not_connected"
  }

  return connected ? "connected" : "not_connected"
}

function statusFromTokenExpiry(tokenExpiresAt?: string | null): ConnectionStatus | null {
  if (!tokenExpiresAt) return null

  const expiresAt = new Date(tokenExpiresAt)
  if (Number.isNaN(expiresAt.getTime())) return null

  return expiresAt.getTime() <= Date.now() ? "reauth_needed" : "connected"
}

function mapIntegration(
  integration?: ApiClientIntegration | ApiClientConnection | null,
): ClientConnection {
  if (!integration) {
    return { status: "not_connected" }
  }

  return {
    status: parseConnectionStatus(integration.status, integration.connected),
    accountEmail: integration.accountEmail ?? integration.account_email,
    companyId: integration.companyId ?? integration.company_id,
    connectedAt: integration.connectedAt ?? integration.connected_at,
    lastSyncAt: integration.lastSyncAt ?? integration.last_sync_at,
  }
}

function mapConnector(connector?: ApiClientConnector | null): ClientConnection {
  if (!connector || connector.enabled === false) {
    return { status: "not_connected" }
  }

  const tokenStatus = statusFromTokenExpiry(connector.config?.tokenExpiresAt)

  return {
    status: tokenStatus ?? "connected",
    accountEmail: connector.config?.accountEmail,
    companyId: connector.config?.companyId,
    tokenExpiresAt: connector.config?.tokenExpiresAt,
  }
}

function findIntegration(
  integrations: ApiClientIntegration[] | undefined,
  provider: IntegrationProvider,
): ApiClientIntegration | undefined {
  return integrations?.find((item) => normalizeIntegrationProvider(item.provider) === provider)
}

function findConnector(
  connectors: ApiClientConnector[] | undefined,
  provider: IntegrationProvider,
): ApiClientConnector | undefined {
  return connectors?.find((item) => normalizeIntegrationProvider(item.provider) === provider)
}

function connectionFromLegacyList(
  connections: ApiClientConnection[] | undefined,
  provider: IntegrationProvider,
): ClientConnection {
  const match = connections?.find(
    (item) => normalizeIntegrationProvider(item.provider) === provider,
  )

  if (!match) return { status: "not_connected" }
  return mapIntegration(match)
}

function getProviderConnection(
  client: ApiClient | ApiClientDetail,
  provider: IntegrationProvider,
): ClientConnection {
  const connector = findConnector(client.connectors, provider)
  if (connector) return mapConnector(connector)

  const fromIntegrations = findIntegration(client.integrations, provider)
  if (fromIntegrations) return mapIntegration(fromIntegrations)

  if (provider === "quickbooks" && client.qboConnection) {
    return mapIntegration(client.qboConnection)
  }

  if (provider === "google_drive" && client.driveConnection) {
    return mapIntegration(client.driveConnection)
  }

  return connectionFromLegacyList(client.connections, provider)
}

export function getClientQboConnection(client: ApiClient | ApiClientDetail): ClientConnection {
  return getProviderConnection(client, "quickbooks")
}

export function getClientDriveConnection(client: ApiClient | ApiClientDetail): ClientConnection {
  return getProviderConnection(client, "google_drive")
}

export function getActiveActivityCount(client: ApiClient | ApiClientDetail): number {
  if (typeof client.activeActivityCount === "number") {
    return client.activeActivityCount
  }

  if ("activities" in client && client.activities?.length) {
    return client.activities.filter(
      (activity) => !COMPLETED_ACTIVITY_STATUSES.has((activity.status ?? "").toLowerCase()),
    ).length
  }

  if (client.activityCounts) {
    return Object.entries(client.activityCounts).reduce((sum, [status, count]) => {
      if (COMPLETED_ACTIVITY_STATUSES.has(status.toLowerCase())) return sum
      return sum + (count ?? 0)
    }, 0)
  }

  return client.activityCount ?? 0
}

export function getTeamCount(client: ApiClient | ApiClientDetail): number {
  if (typeof client.teamCount === "number") return client.teamCount
  if ("members" in client && client.members) return client.members.length
  return 0
}
