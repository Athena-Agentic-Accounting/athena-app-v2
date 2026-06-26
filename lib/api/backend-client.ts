import { getApiBaseUrl } from "@/lib/api/config"
import { backendAuthHeaders } from "@/lib/api/headers"

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: string
  token: string | null
  body?: unknown
  signal?: AbortSignal
}

export async function backendRequest<T>(
  path: string,
  { method = "GET", token, body, signal }: RequestOptions,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`

  const response = await fetch(url, {
    method,
    headers: backendAuthHeaders(
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
        : `Request failed (${response.status})`
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
