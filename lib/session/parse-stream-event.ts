import type { ActivityStreamEvent, CardEventPayload } from "@/lib/genui/types"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

export function parseStreamEvent(
  raw: unknown,
  fallbackActivityId: string,
): ActivityStreamEvent | null {
  const record = asRecord(raw)
  if (!record) return null

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
  const index = current.findIndex((event) => event.id === incoming.id)
  if (index === -1) return [...current, incoming]
  return current.map((event, eventIndex) => (eventIndex === index ? incoming : event))
}
