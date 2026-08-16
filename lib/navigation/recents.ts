"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "athena.recents.v1"
const UPDATE_EVENT = "athena:recents"
const MAX_ITEMS = 6

export type RecentItemKind = "activity" | "client" | "skill"

export type RecentItem = {
  id: string
  label: string
  href: string
  kind: RecentItemKind
  visitedAt: number
}

function readRecents(): RecentItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as RecentItem).href === "string" &&
        typeof (item as RecentItem).label === "string" &&
        typeof (item as RecentItem).visitedAt === "number",
    )
  } catch {
    return []
  }
}

export function trackRecent(item: Omit<RecentItem, "visitedAt">): void {
  if (typeof window === "undefined") return
  try {
    const next = [
      { ...item, visitedAt: Date.now() },
      ...readRecents().filter((existing) => existing.href !== item.href),
    ].slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
  } catch {
    // localStorage unavailable (private mode etc.) — recents are best-effort.
  }
}

export function useRecentItems(): RecentItem[] {
  const [items, setItems] = useState<RecentItem[]>([])

  const refresh = useCallback(() => setItems(readRecents()), [])

  useEffect(() => {
    refresh()
    window.addEventListener(UPDATE_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [refresh])

  return items
}

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return "now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

export const RECENT_KIND_LABELS: Record<RecentItemKind, string> = {
  activity: "Activity",
  client: "Client",
  skill: "Skill",
}
