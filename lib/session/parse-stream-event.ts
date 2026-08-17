import type { ActivityStreamEvent, CardEventPayload } from "@/lib/genui/types"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

const ENGINE_METADATA_DENYLIST = new Set([
  "gateId",
  "gate_id",
  "fileId",
  "file_id",
  "id",
  "timestamp",
  "createdAt",
  "created_at",
])

/** Recursively sorts object keys and excludes engine-minted metadata for stable hashing */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return JSON.stringify(obj) ?? ""
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalStringify).join(",")}]`
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  const pairs = keys
    .filter((k) => !ENGINE_METADATA_DENYLIST.has(k))
    .filter((k) => (obj as Record<string, unknown>)[k] !== undefined && (obj as Record<string, unknown>)[k] !== null)
    .map((k) => `${JSON.stringify(k)}:${canonicalStringify((obj as Record<string, unknown>)[k])}`)
  return `{${pairs.join(",")}}`
}

/** Deterministic 32-bit FNV-1a hash */
export function fnv1a(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

/** Computes a stable cross-transport fingerprint relying exclusively on agent-emitted fields */
export function computeEventFingerprint(event: CardEventPayload): string {
  const type = event.type
  const data = ((event as any).data ?? {}) as Record<string, any>
  const step = data?.stepIndex != null ? `step:${data.stepIndex}` : ""

  switch (type) {
    case "approval_gate": {
      const target = data?.pendingAction?.target ?? data?.pending_action?.target ?? ""
      const gateDesc = data?.title ? `${data.title}:${target}` : fnv1a(canonicalStringify(data?.payload ?? {}))
      return `approval_gate:${step}:${gateDesc}`
    }
    case "file_created":
      return `file_created:${data?.fileName || data?.file_name || data?.fileUrl || data?.file_url || fnv1a(canonicalStringify(data))}`
    case "checklist":
      return `checklist:${step}:${data?.title || fnv1a(canonicalStringify(data?.items ?? data))}`
    case "progress":
      return `progress:${data?.stepIndex ?? data?.stepDescription ?? data?.step_description ?? "active"}`
    default:
      return `${type}:${step}:${fnv1a(canonicalStringify(data))}`
  }
}

/** Non-clobbering merge preserving engine-enriched values */
export function mergeEventData(
  existing: Record<string, any> = {},
  incoming: Record<string, any> = {},
): Record<string, any> {
  const result = { ...existing }
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null) {
      result[key] = value
    }
  }
  return result
}

export function parseStreamEvent(
  raw: unknown,
  fallbackActivityId: string,
): ActivityStreamEvent | null {
  const record = asRecord(raw)
  if (!record) return null

  const eventType = record.event && asRecord(record.event)?.type ? asRecord(record.event)?.type : record.type
  if (
    eventType === "message" ||
    eventType === "assistant_message" ||
    eventType === "assistant" ||
    eventType === "ping" ||
    eventType === "connection"
  ) {
    return null
  }

  if (record.event && asRecord(record.event)?.type) {
    return {
      id: String(record.id ?? crypto.randomUUID()),
      activityId: String(record.activityId ?? record.activity_id ?? fallbackActivityId),
      timestamp: typeof record.timestamp === "string" ? record.timestamp : undefined,
      event: record.event as CardEventPayload,
    }
  }

  const type = record.type
  const data = record.data ?? record.payload
  if (typeof type === "string" && data && typeof data === "object") {

    return {
      id: String(record.id ?? record.eventId ?? crypto.randomUUID()),
      activityId: String(record.activityId ?? record.activity_id ?? fallbackActivityId),
      timestamp: typeof record.timestamp === "string" ? record.timestamp : undefined,
      event: { type, data } as CardEventPayload,
    }
  }

  return null
}

export function mergeStreamEvents(
  current: ActivityStreamEvent[],
  incoming: ActivityStreamEvent,
): ActivityStreamEvent[] {
  const incomingFingerprint = computeEventFingerprint(incoming.event)
  const index = current.findIndex(
    (e) => computeEventFingerprint(e.event) === incomingFingerprint || e.id === incoming.id,
  )

  if (index === -1) {
    return [...current, incoming]
  }

  const existing = current[index]
  const updatedEvent: ActivityStreamEvent = {
    ...existing,
    ...incoming,
    event: {
      ...existing.event,
      ...incoming.event,
      data: mergeEventData((existing.event as any).data, (incoming.event as any).data),
    } as CardEventPayload,
  }

  const updated = [...current]
  updated[index] = updatedEvent
  return updated
}

