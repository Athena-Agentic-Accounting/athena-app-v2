import { backendRequest } from "@/lib/api/backend-client"
import { unwrapList } from "@/lib/api/unwrap"

export type ApiNotification = {
  id: string
  title?: string
  message?: string
  body?: string
  read?: boolean
  isRead?: boolean
  createdAt?: string
  created_at?: string
  type?: string
}

export async function listNotifications(
  token: string | null,
  params?: { unread?: boolean; limit?: number },
): Promise<ApiNotification[]> {
  const search = new URLSearchParams()
  if (params?.unread) search.set("unread", "true")
  if (params?.limit !== undefined) search.set("limit", String(params.limit))
  const query = search.toString() ? `?${search.toString()}` : ""

  const data = await backendRequest<
    { notifications?: ApiNotification[] } | ApiNotification[]
  >(`/api/notifications${query}`, { token })

  return unwrapList(data, ["notifications"])
}

export async function markNotificationRead(
  token: string | null,
  notificationId: string,
): Promise<void> {
  await backendRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    token,
  })
}
