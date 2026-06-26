/** Temporary ngrok bypass — remove when tunnel is no longer used. */
const NGROK_SKIP_HEADER = {
  "ngrok-skip-browser-warning": "true",
} as const

export function shouldUseNgrokSkipHeader(): boolean {
  if (process.env.NEXT_PUBLIC_NGROK_SKIP_BROWSER_WARNING === "true") {
    return true
  }
  if (process.env.NGROK_SKIP_BROWSER_WARNING === "true") {
    return true
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  return /ngrok/i.test(baseUrl)
}

export function ngrokSkipHeaders(): Record<string, string> {
  return shouldUseNgrokSkipHeader() ? { ...NGROK_SKIP_HEADER } : {}
}

export function backendHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  return { ...ngrokSkipHeaders(), ...extra }
}

export function backendAuthHeaders(
  token: string | null,
  extra: Record<string, string> = {}
): Record<string, string> {
  return backendHeaders({
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })
}
