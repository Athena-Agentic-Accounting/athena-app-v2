import type { ApiClient } from "@/lib/api/clients"
import type { Client } from "@/lib/clients/mock-clients"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export { getInitials }

export function mapApiClientToClient(apiClient: ApiClient): Client {
  return {
    id: apiClient.id,
    name: apiClient.name,
    initials: getInitials(apiClient.name),
  }
}
