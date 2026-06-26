import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  getIntegrationDescription,
  getIntegrationLabel,
} from "@/lib/integrations/connect-integration"

export function normalizeIntegrationProvider(
  provider: string,
): IntegrationProvider | null {
  const value = provider.toLowerCase().replace(/-/g, "_")
  if (value === "quickbooks" || value === "quickbooks_online") {
    return "quickbooks"
  }
  if (value === "google_drive") {
    return "google_drive"
  }
  return null
}

export function getIntegrationHealthLabel(health?: string): string {
  if (!health) return "Unknown"
  return health
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getIntegrationHealthVariant(
  health?: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (!health) return "outline"
  const value = health.toLowerCase()
  if (value.includes("healthy") || value.includes("connected") || value === "ok") {
    return "default"
  }
  if (value.includes("partial") || value.includes("pending") || value.includes("warning")) {
    return "secondary"
  }
  if (value.includes("error") || value.includes("disconnected") || value.includes("failed")) {
    return "destructive"
  }
  return "outline"
}

export function getProviderDisplayName(provider: string): string {
  const normalized = normalizeIntegrationProvider(provider)
  if (normalized) return getIntegrationLabel(normalized)
  return provider
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getProviderDescription(provider: string): string | undefined {
  const normalized = normalizeIntegrationProvider(provider)
  if (!normalized) return undefined
  return getIntegrationDescription(normalized)
}
