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
    throw new ApiError(errorMessage(payload, response.status), response.status, payload)
  }

  return payload as T
}

type UploadOptions = {
  method?: string
  token: string | null
  formData: FormData
}

/** Multipart variant of backendRequest — never sets Content-Type (the browser
 * adds the multipart boundary itself). */
export async function backendUpload<T>(
  path: string,
  { method = "POST", token, formData }: UploadOptions,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`

  const response = await fetch(url, {
    method,
    headers: backendAuthHeaders(token),
    body: formData,
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
    throw new ApiError(errorMessage(payload, response.status), response.status, payload)
  }

  return payload as T
}

function errorMessage(payload: unknown, status: number): string {
  return typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
    ? (payload as { error: string }).error
    : `Request failed (${status})`
}
