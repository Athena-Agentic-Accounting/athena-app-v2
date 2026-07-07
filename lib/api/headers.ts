export function backendAuthHeaders(
  token: string | null,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function agentAuthHeaders(
  token: string | null,
  extra: Record<string, string> = {},
): Record<string, string> {
  return backendAuthHeaders(token, extra);
}
