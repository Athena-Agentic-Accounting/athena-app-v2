/** Human-readable label for backend activity.type values (e.g. close_task, AD_HOC). */
export function formatActivityType(type?: string | null): string {
  if (!type) return "General"

  const normalized = type.trim()
  if (!normalized) return "General"

  if (normalized.toUpperCase() === "AD_HOC") return "Ad hoc"

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}
