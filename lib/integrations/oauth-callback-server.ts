import { getApiBaseUrl } from "@/lib/api/config"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"

/** Engine connection callback slug — matches `/api/connections/{slug}/callback`. */
export type OAuthConnectionSlug = "google-drive" | "quickbooks"

export type DecodedOAuthState = {
  orgId?: string
  userId?: string
  provider?: string
  clientId?: string
}

export type OAuthCallbackResult = {
  ok: boolean
  message?: string
  clientId?: string | null
  provider?: IntegrationProvider | null
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, "base64").toString("utf8")
}

export function decodeOAuthState(state: string | null | undefined): DecodedOAuthState | null {
  if (!state) return null

  const payloadSegment = state.split(".")[1]
  if (!payloadSegment) return null

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as DecodedOAuthState
    return payload && typeof payload === "object" ? payload : null
  } catch {
    return null
  }
}

export function normalizeIntegrationProviderFromState(
  raw?: string | null,
): IntegrationProvider | null {
  if (!raw) return null

  const value = raw.toLowerCase()
  if (value.includes("quickbooks") || value === "qbo") return "quickbooks"
  if (value.includes("google") || value.includes("drive")) return "google_drive"
  return null
}

export function providerFromConnectionSlug(
  connection: OAuthConnectionSlug,
): IntegrationProvider {
  return connection === "quickbooks" ? "quickbooks" : "google_drive"
}

function providerFromEngineRedirectParam(raw: string | null): IntegrationProvider | null {
  if (!raw) return null
  const value = raw.toLowerCase()
  if (value === "quickbooks" || value.includes("quickbooks")) return "quickbooks"
  if (value === "google-drive" || value.includes("google") || value.includes("drive")) {
    return "google_drive"
  }
  return null
}

function engineCallbackPath(connection: OAuthConnectionSlug): string {
  return `/api/connections/${connection}/callback`
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload && typeof (payload as { error: unknown }).error === "string") {
      return (payload as { error: string }).error
    }
    if ("message" in payload && typeof (payload as { message: unknown }).message === "string") {
      return (payload as { message: string }).message
    }
  }

  if (typeof payload === "string" && payload.trim()) return payload.trim()
  return fallback
}

function parseEngineRedirectLocation(
  location: string,
  fallback: Pick<OAuthCallbackResult, "provider" | "clientId">,
): OAuthCallbackResult | null {
  try {
    const redirectUrl = new URL(location)
    const redirectStatus = redirectUrl.searchParams.get("status")
    const redirectMessage = redirectUrl.searchParams.get("message")
    const provider =
      providerFromEngineRedirectParam(redirectUrl.searchParams.get("provider")) ??
      fallback.provider ??
      null

    if (redirectStatus === "success") {
      return { ok: true, provider, clientId: fallback.clientId ?? null }
    }

    if (redirectStatus === "error") {
      return {
        ok: false,
        provider,
        clientId: fallback.clientId ?? null,
        message: redirectMessage ?? "Connection failed.",
      }
    }
  } catch {
    // Ignore malformed redirect URLs.
  }

  return null
}

export async function completeIntegrationOAuthCallback(
  connection: OAuthConnectionSlug,
  searchParams: URLSearchParams,
): Promise<OAuthCallbackResult> {
  const decodedState = decodeOAuthState(searchParams.get("state"))
  const provider =
    normalizeIntegrationProviderFromState(decodedState?.provider) ??
    providerFromConnectionSlug(connection)
  const clientId = decodedState?.clientId ?? null

  const oauthError = searchParams.get("error")
  if (oauthError) {
    return {
      ok: false,
      message:
        searchParams.get("error_description") ??
        searchParams.get("message") ??
        "Authorization was denied or cancelled.",
      provider,
      clientId,
    }
  }

  if (!searchParams.get("code")) {
    return {
      ok: false,
      message: "Missing authorization code from the provider.",
      provider,
      clientId,
    }
  }

  const backendUrl = `${getApiBaseUrl()}${engineCallbackPath(connection)}?${searchParams.toString()}`

  try {
    const response = await fetch(backendUrl, { redirect: "manual" })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (location) {
        const parsed = parseEngineRedirectLocation(location, { provider, clientId })
        if (parsed) return parsed
      }
    }

    const text = await response.text()
    let payload: unknown = null
    if (text) {
      try {
        payload = JSON.parse(text) as unknown
      } catch {
        payload = text
      }
    }

    if (response.ok) {
      return { ok: true, provider, clientId }
    }

    return {
      ok: false,
      provider,
      clientId,
      message: extractErrorMessage(payload, `Connection failed (${response.status}).`),
    }
  } catch (err) {
    return {
      ok: false,
      provider,
      clientId,
      message: err instanceof Error ? err.message : "Could not complete the connection.",
    }
  }
}

export function buildIntegrationCallbackRedirect(
  requestUrl: string,
  result: OAuthCallbackResult,
): URL {
  const redirectUrl = new URL("/integrations/callback", requestUrl)

  redirectUrl.searchParams.set("status", result.ok ? "success" : "error")

  if (result.provider) {
    redirectUrl.searchParams.set("provider", result.provider)
  }

  if (result.clientId) {
    redirectUrl.searchParams.set("clientId", result.clientId)
  }

  if (result.message) {
    redirectUrl.searchParams.set("message", result.message)
  }

  return redirectUrl
}

export async function handleOAuthCallbackRequest(
  request: Request,
  connection: OAuthConnectionSlug,
): Promise<Response> {
  const { NextResponse } = await import("next/server")
  const requestUrl = new URL(request.url)
  const result = await completeIntegrationOAuthCallback(connection, requestUrl.searchParams)
  const redirectUrl = buildIntegrationCallbackRedirect(request.url, result)
  return NextResponse.redirect(redirectUrl)
}
