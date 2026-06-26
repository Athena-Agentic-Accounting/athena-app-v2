import type { ApiClient } from "@/lib/api/clients"
import { getIntegrationHealthLabel } from "@/lib/clients/integration-display"

export type ClientsSortKey =
  | "name"
  | "integrationHealth"
  | "activityCount"
  | "pendingApprovals"

export type ClientsSortDirection = "asc" | "desc"

export type IntegrationHealthFilter =
  | "all"
  | "healthy"
  | "attention"
  | "disconnected"

export type PendingFilter = "all" | "has_pending" | "clear"

export type ActivityFilter = "all" | "active" | "idle" | "high"

export type ClientsTableFilters = {
  query: string
  integrationHealth: IntegrationHealthFilter
  pending: PendingFilter
  activity: ActivityFilter
}

export const DEFAULT_CLIENTS_TABLE_FILTERS: ClientsTableFilters = {
  query: "",
  integrationHealth: "all",
  pending: "all",
  activity: "all",
}

function healthBucket(health?: string): IntegrationHealthFilter {
  if (!health) return "attention"
  const value = health.toLowerCase()
  if (value.includes("healthy") || value.includes("connected") || value === "ok") {
    return "healthy"
  }
  if (value.includes("error") || value.includes("disconnected") || value.includes("failed")) {
    return "disconnected"
  }
  return "attention"
}

export function filterClients(
  clients: ApiClient[],
  filters: ClientsTableFilters,
): ApiClient[] {
  const query = filters.query.trim().toLowerCase()

  return clients.filter((client) => {
    if (query) {
      const haystack = `${client.name} ${client.id}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (
      filters.integrationHealth !== "all" &&
      healthBucket(client.integrationHealth) !== filters.integrationHealth
    ) {
      return false
    }

    const pending = client.pendingApprovals ?? 0
    if (filters.pending === "has_pending" && pending === 0) return false
    if (filters.pending === "clear" && pending > 0) return false

    const activities = client.activityCount ?? 0
    if (filters.activity === "active" && activities === 0) return false
    if (filters.activity === "idle" && activities > 0) return false
    if (filters.activity === "high" && activities < 5) return false

    return true
  })
}

export function sortClients(
  clients: ApiClient[],
  sortKey: ClientsSortKey,
  direction: ClientsSortDirection,
): ApiClient[] {
  const sorted = [...clients].sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.name.localeCompare(b.name)
      case "integrationHealth":
        return getIntegrationHealthLabel(a.integrationHealth).localeCompare(
          getIntegrationHealthLabel(b.integrationHealth),
        )
      case "activityCount":
        return (a.activityCount ?? 0) - (b.activityCount ?? 0)
      case "pendingApprovals":
        return (a.pendingApprovals ?? 0) - (b.pendingApprovals ?? 0)
      default:
        return 0
    }
  })

  return direction === "asc" ? sorted : sorted.reverse()
}

export function exportClientsCsv(clients: ApiClient[]) {
  const headers = [
    "Client ID",
    "Client name",
    "Integration health",
    "Activities",
    "Pending approvals",
  ]

  const rows = clients.map((client) => [
    client.id,
    client.name,
    getIntegrationHealthLabel(client.integrationHealth),
    String(client.activityCount ?? 0),
    String(client.pendingApprovals ?? 0),
  ])

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function countActiveFilters(filters: ClientsTableFilters): number {
  let count = 0
  if (filters.integrationHealth !== "all") count += 1
  if (filters.pending !== "all") count += 1
  if (filters.activity !== "all") count += 1
  return count
}
