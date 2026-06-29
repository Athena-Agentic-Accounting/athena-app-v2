import { backendRequest } from "@/lib/api/backend-client";
import { getApiBaseUrl } from "@/lib/api/config";
import { backendAuthHeaders } from "@/lib/api/headers";
import { readSseResponse, type SseHandlers } from "@/lib/api/sse";
import { unwrapList } from "@/lib/api/unwrap";

export type ApiNotification = {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  created_at?: string;
  type?: string;
};

export async function listNotifications(
  token: string | null,
  params?: { unread?: boolean; limit?: number },
): Promise<ApiNotification[]> {
  const search = new URLSearchParams();
  if (params?.unread) search.set("unread", "true");
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : "";

  const data = await backendRequest<
    { notifications?: ApiNotification[] } | ApiNotification[]
  >(`/api/notifications${query}`, { token });

  return unwrapList(data, ["notifications"]);
}

export async function markNotificationRead(
  token: string | null,
  notificationId: string,
): Promise<void> {
  await backendRequest(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "POST",
      token,
    },
  );
}

export function subscribeNotificationStream(
  token: string | null,
  handlers: SseHandlers,
): () => void {
  const controller = new AbortController();
  const url = `${getApiBaseUrl()}/api/notifications/stream`;

  void (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          ...backendAuthHeaders(token),
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });

      await readSseResponse(response, handlers);
    } catch (err) {
      if (controller.signal.aborted) return;
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => controller.abort();
}

export async function getVapidPublicKey(
  token: string | null,
): Promise<string | null> {
  const data = await backendRequest<{ publicKey?: string }>(
    "/api/push/vapid-public-key",
    { token },
  );

  return data.publicKey ?? null;
}

export async function subscribePush(
  token: string | null,
  subscription: PushSubscription,
): Promise<void> {
  await backendRequest("/api/push/subscribe", {
    method: "POST",
    token,
    body: { subscription: subscription.toJSON() },
  });
}

export async function unsubscribePush(
  token: string | null,
  endpoint: string,
): Promise<void> {
  await backendRequest("/api/push/unsubscribe", {
    method: "POST",
    token,
    body: { endpoint },
  });
}
