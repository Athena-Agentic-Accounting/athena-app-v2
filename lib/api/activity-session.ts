import { agentRequest } from "@/lib/api/agent-client"
import { getAgentBaseUrl } from "@/lib/api/config"
import { agentAuthHeaders } from "@/lib/api/headers"
import { readSseResponse, type SseHandlers } from "@/lib/api/sse"
import { unwrapRecord } from "@/lib/api/unwrap"
import type { ActivityMessage } from "@/lib/activities/types"

export async function postAgentActivityMessage(
  token: string | null,
  activityId: string,
  content: string,
): Promise<ActivityMessage> {
  const data = await agentRequest<{ message?: ActivityMessage } | ActivityMessage>(
    `/api/activities/${encodeURIComponent(activityId)}/messages`,
    {
      method: "POST",
      token,
      body: { content },
    },
  )

  return unwrapRecord(data, ["message"])
}

export function subscribeAgentActivityStream(
  token: string | null,
  activityId: string,
  handlers: SseHandlers,
): () => void {
  const controller = new AbortController()
  const url = `${getAgentBaseUrl()}/api/activities/${encodeURIComponent(activityId)}/stream`

  void (async () => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...agentAuthHeaders(token),
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      })

      await readSseResponse(response, handlers)
    } catch (err) {
      if (controller.signal.aborted) return
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return () => controller.abort()
}
