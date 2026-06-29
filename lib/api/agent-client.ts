import { getAgentBaseUrl } from "@/lib/api/config"
import { agentAuthHeaders } from "@/lib/api/headers"
import { ApiError } from "@/lib/api/backend-client"

type RequestOptions = {
  method?: string
  token: string | null
  body?: unknown
  signal?: AbortSignal
}

export async function agentRequest<T>(
  path: string,
  { method = "GET", token, body, signal }: RequestOptions,
): Promise<T> {
  const url = `${getAgentBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`

  const response = await fetch(url, {
    method,
    headers: agentAuthHeaders(
      token,
      body !== undefined ? { "Content-Type": "application/json" } : {},
    ),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Agent request failed (${response.status})`
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
