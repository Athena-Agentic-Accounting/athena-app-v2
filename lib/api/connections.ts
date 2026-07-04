import { backendRequest } from "@/lib/api/backend-client"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"

type ConnectResponse = {
  authUrl: string
}

function providerPath(provider: IntegrationProvider): string {
  return provider === "google_drive" ? "google-drive" : "quickbooks"
}

export async function getIntegrationAuthUrl(
  token: string | null,
  provider: IntegrationProvider,
  clientId: string,
): Promise<string> {
  const data = await backendRequest<ConnectResponse>(
    `/api/connections/${providerPath(provider)}/connect`,
    {
      method: "POST",
      token,
      body: { clientId },
    },
  )

  if (!data.authUrl) {
    throw new Error("No authorization URL returned by the server.")
  }

  return data.authUrl
}

export async function disconnectIntegration(
  token: string | null,
  provider: IntegrationProvider,
  clientId: string,
): Promise<void> {
  await backendRequest(`/api/connections/${providerPath(provider)}/disconnect`, {
    method: "POST",
    token,
    body: { clientId },
  })
}


export async function setGoogleDriveFolder(
  token: string | null,
  clientId: string,
  folderId: string,
): Promise<void> {
  await backendRequest(`/api/connections/google-drive/folder`, {
    method: "POST",
    token,
    body: { clientId, folderId },
  })
}
