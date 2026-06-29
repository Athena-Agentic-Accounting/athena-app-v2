/** Temporary ngrok bypass — remove when tunnel is no longer used. */
const NGROK_SKIP_HEADER = {
  "ngrok-skip-browser-warning": "true",
} as const;

export function shouldUseNgrokSkipHeader(
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
): boolean {
  if (process.env.NEXT_PUBLIC_NGROK_SKIP_BROWSER_WARNING === "true") {
    return true;
  }
  if (process.env.NGROK_SKIP_BROWSER_WARNING === "true") {
    return true;
  }
  return /ngrok/i.test(baseUrl);
}

export function ngrokSkipHeaders(baseUrl?: string): Record<string, string> {
  return shouldUseNgrokSkipHeader(baseUrl) ? { ...NGROK_SKIP_HEADER } : {};
}

export function backendHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...ngrokSkipHeaders(process.env.NEXT_PUBLIC_API_BASE_URL),
    ...extra,
  };
}

export function backendAuthHeaders(
  token: string | null,
  extra: Record<string, string> = {},
): Record<string, string> {
  return backendHeaders({
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
}

export function agentHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...ngrokSkipHeaders(process.env.NEXT_PUBLIC_AGENT_BASE_URL),
    ...extra,
  };
}

export function agentAuthHeaders(
  token: string | null,
  extra: Record<string, string> = {},
): Record<string, string> {
  return agentHeaders({
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
}
