export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:4000"
  );
}

export function getAgentBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_AGENT_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_AGENT_BASE_URL is not set — chat and live streaming go directly to the agent (athena-ai) and cannot fall back to the engine.",
    );
  }
  return base;
}
