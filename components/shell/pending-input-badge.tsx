"use client"

import Link from "next/link"

import { useSessionRegistry } from "@/lib/session/session-registry"

export function PendingInputBadge() {
  // Pending actions are surfaced in sidebar counters and Attention feed without floating overlays
  return null
}
