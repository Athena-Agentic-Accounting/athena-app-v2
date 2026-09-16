import { getIntegrationAuthUrl } from "@/lib/api/connections"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import { openOAuthPopup } from "@/lib/integrations/oauth-popup"

export function getIntegrationLabel(provider: IntegrationProvider): string {
  switch (provider) {
    case "quickbooks":
      return "QuickBooks Online"
    case "google_drive":
      return "Google Drive"
  }
}

export function getIntegrationDescription(provider: IntegrationProvider): string {
  switch (provider) {
    case "quickbooks":
      return "Connect your books so LUCA can read transactions, accounts, and your chart of accounts."
    case "google_drive":
      return "Optional — attach supporting documents and let LUCA reference files in context."
  }
}

export async function connectIntegration(
  provider: IntegrationProvider,
  options: {
    token: string | null
    clientId: string
  },
): Promise<{ success: true; provider: IntegrationProvider }> {
  const authUrl = await getIntegrationAuthUrl(options.token, provider, options.clientId)
  await openOAuthPopup(authUrl)
  return { success: true, provider }
}
