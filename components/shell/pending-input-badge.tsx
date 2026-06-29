"use client"

import Link from "next/link"

import { useSessionRegistry } from "@/lib/session/session-registry"

export function PendingInputBadge() {
  const { pendingInputActivityIds } = useSessionRegistry()
  const firstActivityId = pendingInputActivityIds[0]

  if (!firstActivityId) return null

  return (
    <Link
      href={`/activities/${firstActivityId}`}
      className="fixed bottom-4 right-4 z-50 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-lg hover:bg-amber-100"
    >
      Athena needs input
      {pendingInputActivityIds.length > 1 ? ` (${pendingInputActivityIds.length})` : ""}
    </Link>
  )
}
