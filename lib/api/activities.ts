import { backendRequest } from "@/lib/api/backend-client"
import type { ActivityBoardResponse } from "@/lib/activities/board-types"
import type {
  ActivityMessage,
  ActivityPromptResponse,
  ActivityRecord,
  CreateActivityRequest,
  CreateActivityResult,
  UpdateActivityRequest,
  UpdateActivityStatusRequest,
} from "@/lib/activities/types"
import type { ScheduleRecord } from "@/lib/schedules/types"
import { getApiBaseUrl } from "@/lib/api/config"
import { backendAuthHeaders } from "@/lib/api/headers"
import { unwrapList, unwrapRecord } from "@/lib/api/unwrap"

export async function getActivityBoard(
  token: string | null,
  clientId?: string | null,
): Promise<ActivityBoardResponse> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""
  return backendRequest<ActivityBoardResponse>(`/api/activities/board${query}`, {
    token,
  })
}

export async function createActivity(
  token: string | null,
  body: CreateActivityRequest,
): Promise<CreateActivityResult> {
  const data = await backendRequest<
    | { activity?: ActivityRecord; schedule?: ScheduleRecord }
    | ActivityRecord
    | ScheduleRecord
  >("/api/activities", {
    method: "POST",
    token,
    body,
  })

  if (data && typeof data === "object" && "schedule" in data && data.schedule) {
    return {
      kind: "schedule",
      schedule: unwrapRecord<ScheduleRecord>(data, ["schedule"]),
    }
  }

  return {
    kind: "activity",
    activity: unwrapRecord<ActivityRecord>(data, ["activity"]),
  }
}

export async function submitActivityPrompt(
  token: string | null,
  body: { clientId: string; prompt: string },
): Promise<ActivityPromptResponse> {
  return backendRequest<ActivityPromptResponse>("/api/activities/prompt", {
    method: "POST",
    token,
    body,
  })
}

export async function getActivity(
  token: string | null,
  activityId: string,
): Promise<ActivityRecord> {
  const data = await backendRequest<{ activity?: ActivityRecord } | ActivityRecord>(
    `/api/activities/${encodeURIComponent(activityId)}`,
    { token },
  )

  return unwrapRecord(data, ["activity"])
}

export async function getActivityAudit(
  token: string | null,
  activityId: string,
): Promise<unknown> {
  return backendRequest(`/api/activities/${encodeURIComponent(activityId)}/audit`, {
    token,
  })
}

export async function updateActivity(
  token: string | null,
  activityId: string,
  body: UpdateActivityRequest,
): Promise<ActivityRecord> {
  const data = await backendRequest<{ activity?: ActivityRecord } | ActivityRecord>(
    `/api/activities/${encodeURIComponent(activityId)}`,
    {
      method: "PATCH",
      token,
      body,
    },
  )

  return unwrapRecord(data, ["activity"])
}

export async function updateActivityStatus(
  token: string | null,
  activityId: string,
  body: UpdateActivityStatusRequest,
): Promise<ActivityRecord> {
  const data = await backendRequest<{ activity?: ActivityRecord } | ActivityRecord>(
    `/api/activities/${encodeURIComponent(activityId)}/status`,
    {
      method: "POST",
      token,
      body,
    },
  )

  return unwrapRecord(data, ["activity"])
}

export async function confirmActivityPlan(
  token: string | null,
  activityId: string,
): Promise<ActivityRecord> {
  const data = await backendRequest<{ activity?: ActivityRecord } | ActivityRecord>(
    `/api/activities/${encodeURIComponent(activityId)}/confirm-plan`,
    {
      method: "POST",
      token,
    },
  )

  return unwrapRecord(data, ["activity"])
}

export async function getActivityMessages(
  token: string | null,
  activityId: string,
  params?: { limit?: number; offset?: number },
): Promise<ActivityMessage[]> {
  const search = new URLSearchParams()
  if (params?.limit !== undefined) search.set("limit", String(params.limit))
  if (params?.offset !== undefined) search.set("offset", String(params.offset))
  const query = search.toString() ? `?${search.toString()}` : ""

  const data = await backendRequest<{ messages?: ActivityMessage[] } | ActivityMessage[]>(
    `/api/activities/${encodeURIComponent(activityId)}/messages${query}`,
    { token },
  )

  return unwrapList(data, ["messages"])
}

export async function postActivityMessage(
  token: string | null,
  activityId: string,
  content: string,
): Promise<ActivityMessage> {
  const data = await backendRequest<{ message?: ActivityMessage } | ActivityMessage>(
    `/api/activities/${encodeURIComponent(activityId)}/messages`,
    {
      method: "POST",
      token,
      body: { content },
    },
  )

  return unwrapRecord(data, ["message"])
}

export type ActivityStreamHandlers = {
  onEvent: (event: unknown) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onDone?: () => void
}

function extractSseDataPayloads(chunk: string): string[] {
  const payloads: string[] = []

  for (const line of chunk.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue
    const payload = line.replace(/^data:\s?/, "").trim()
    if (payload) payloads.push(payload)
  }

  return payloads
}

/** Subscribe to live GenUI SSE events for an activity. Returns an abort function. */
export function subscribeActivityStream(
  token: string | null,
  activityId: string,
  handlers: ActivityStreamHandlers,
): () => void {
  const controller = new AbortController()
  const url = `${getApiBaseUrl()}/api/activities/${encodeURIComponent(activityId)}/stream`

  void (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          ...backendAuthHeaders(token),
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed (${response.status})`)
      }

      handlers.onOpen?.()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split(/\r?\n\r?\n/)
        buffer = chunks.pop() ?? ""

        for (const chunk of chunks) {
          for (const payload of extractSseDataPayloads(chunk)) {
            if (payload === "[DONE]") continue

            try {
              handlers.onEvent(JSON.parse(payload) as unknown)
            } catch {
              handlers.onEvent({ type: "narrative", data: { markdown: payload } })
            }
          }
        }
      }

      handlers.onDone?.()
    } catch (err) {
      if (controller.signal.aborted) return
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return () => controller.abort()
}
