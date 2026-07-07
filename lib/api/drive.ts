import { ApiError, backendRequest } from "@/lib/api/backend-client"

export type DriveIndexStatus = {
  documentCount?: number
  lastSyncedAt?: string
  last_synced_at?: string
  indexed?: boolean
}

export type DriveSearchResult = {
  id: string
  filename: string
  name?: string
  snippet?: string
  driveUrl?: string
  drive_url?: string
  webViewLink?: string
}

export async function getDriveIndexStatus(
  token: string | null,
  clientId: string,
): Promise<DriveIndexStatus | null> {
  try {
    const data = await backendRequest<DriveIndexStatus | { index?: DriveIndexStatus }>(
      `/api/drive/index?clientId=${encodeURIComponent(clientId)}`,
      { token },
    )

    if ("index" in data && data.index) return data.index
    return data as DriveIndexStatus
  } catch (err) {
    // "Nothing indexed yet" is a normal state; anything else should surface.
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function searchDriveDocuments(
  token: string | null,
  clientId: string,
  query: string,
): Promise<DriveSearchResult[]> {
  if (!query.trim()) return []

  try {
    const data = await backendRequest<
      DriveSearchResult[] | { results?: DriveSearchResult[]; documents?: DriveSearchResult[] }
    >(
      `/api/drive/search?clientId=${encodeURIComponent(clientId)}&q=${encodeURIComponent(query.trim())}`,
      { token },
    )

    if (Array.isArray(data)) return data
    return data.results ?? data.documents ?? []
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return []
    throw err
  }
}
