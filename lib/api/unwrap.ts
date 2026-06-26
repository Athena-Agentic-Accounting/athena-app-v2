export function unwrapList<T>(
  data: unknown,
  keys: string[] = ["items", "queue", "approvals", "notifications", "skills", "activities", "messages"],
): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]

  if (typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key]
      if (Array.isArray(value)) return value as T[]
    }
  }

  return []
}

export function unwrapRecord<T>(data: unknown, keys: string[]): T {
  if (data && typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key]
      if (value && typeof value === "object") return value as T
    }
  }

  return data as T
}
