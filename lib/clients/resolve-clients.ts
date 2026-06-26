import type { AthenaUnsafeMetadata } from "@/lib/athena/user-metadata"
import {
  DEFAULT_CLIENT_ID,
  MOCK_CLIENTS,
  type Client,
} from "@/lib/clients/mock-clients"

export const ALL_CLIENTS_ID = "all"

export type TenantClientConfig = {
  tenantType: "in_house" | "accounting_firm" | "unknown"
  showClientSwitcher: boolean
  clients: Client[]
  defaultClientId: string
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function resolveTenantClients(
  meta?: AthenaUnsafeMetadata,
): TenantClientConfig {
  const tenantType = meta?.institution?.tenantType

  if (tenantType === "in_house") {
    const orgName = meta?.institution?.organizationName?.trim() || "Your company"
    const id = slugify(orgName) || "company"
    return {
      tenantType: "in_house",
      showClientSwitcher: false,
      clients: [{ id, name: orgName, initials: getInitials(orgName) }],
      defaultClientId: id,
    }
  }

  if (tenantType === "accounting_firm") {
    const firstClientName = meta?.institution?.firstClientName?.trim()
    const clients: Client[] = [
      { id: ALL_CLIENTS_ID, name: "All clients", initials: "All" },
    ]

    if (firstClientName) {
      clients.push({
        id: slugify(firstClientName) || "first-client",
        name: firstClientName,
        initials: getInitials(firstClientName),
      })
    }

    return {
      tenantType: "accounting_firm",
      showClientSwitcher: true,
      clients,
      defaultClientId: ALL_CLIENTS_ID,
    }
  }

  return {
    tenantType: "unknown",
    showClientSwitcher: true,
    clients: MOCK_CLIENTS,
    defaultClientId: DEFAULT_CLIENT_ID,
  }
}
