"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { useActivitySession } from "@/hooks/use-activity-session"
import { getActivityBoard } from "@/lib/api/activities"
import { getBoardColumns } from "@/lib/activities/board-types"

const IN_FLIGHT_STATUSES = new Set(["executing", "awaiting_input"])

type RegisteredSession = {
  activityId: string
  reason?: string
  attachedAt: number
}

type SessionRegistryContextValue = {
  sessions: RegisteredSession[]
  pendingInputActivityIds: string[]
  attachActivitySession: (activityId: string, reason?: string) => void
  detachActivitySession: (activityId: string) => void
  markActivityNeedsInput: (activityId: string) => void
  clearActivityNeedsInput: (activityId: string) => void
}

const SessionRegistryContext = createContext<SessionRegistryContextValue | null>(null)

export function SessionRegistryProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth()
  const [sessionsById, setSessionsById] = useState<Record<string, RegisteredSession>>({})
  const [pendingInputById, setPendingInputById] = useState<Record<string, true>>({})

  const attachActivitySession = useCallback((activityId: string, reason?: string) => {
    setSessionsById((current) => ({
      ...current,
      [activityId]: current[activityId] ?? {
        activityId,
        reason,
        attachedAt: Date.now(),
      },
    }))
  }, [])

  const detachActivitySession = useCallback((activityId: string) => {
    setSessionsById((current) => {
      const next = { ...current }
      delete next[activityId]
      return next
    })
  }, [])

  const markActivityNeedsInput = useCallback((activityId: string) => {
    setPendingInputById((current) => ({ ...current, [activityId]: true }))
  }, [])

  const clearActivityNeedsInput = useCallback((activityId: string) => {
    setPendingInputById((current) => {
      const next = { ...current }
      delete next[activityId]
      return next
    })
  }, [])

  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    async function reattachInFlightActivities() {
      try {
        const token = await getToken()
        const board = await getActivityBoard(token)
        if (cancelled) return

        const columns = getBoardColumns(board)
        for (const [status, activities] of Object.entries(columns)) {
          for (const activity of activities ?? []) {
            const activityStatus = activity.status ?? status
            if (!activityStatus || !IN_FLIGHT_STATUSES.has(activityStatus)) continue
            attachActivitySession(activity.id, "poll-on-load")
            if (activityStatus === "awaiting_input") markActivityNeedsInput(activity.id)
          }
        }
      } catch {
        // Poll-on-load is a catch-all; visible activity pages can still attach directly.
      }
    }

    void reattachInFlightActivities()

    return () => {
      cancelled = true
    }
  }, [attachActivitySession, getToken, isSignedIn, markActivityNeedsInput])

  const value = useMemo<SessionRegistryContextValue>(
    () => ({
      sessions: Object.values(sessionsById),
      pendingInputActivityIds: Object.keys(pendingInputById),
      attachActivitySession,
      detachActivitySession,
      markActivityNeedsInput,
      clearActivityNeedsInput,
    }),
    [
      attachActivitySession,
      clearActivityNeedsInput,
      detachActivitySession,
      markActivityNeedsInput,
      pendingInputById,
      sessionsById,
    ],
  )

  return (
    <SessionRegistryContext.Provider value={value}>
      {children}
      {value.sessions.map((session) => (
        <BackgroundActivitySession
          key={session.activityId}
          activityId={session.activityId}
          markActivityNeedsInput={markActivityNeedsInput}
          clearActivityNeedsInput={clearActivityNeedsInput}
        />
      ))}
    </SessionRegistryContext.Provider>
  )
}

function BackgroundActivitySession({
  activityId,
  markActivityNeedsInput,
  clearActivityNeedsInput,
}: {
  activityId: string
  markActivityNeedsInput: (activityId: string) => void
  clearActivityNeedsInput: (activityId: string) => void
}) {
  const session = useActivitySession(activityId)

  useEffect(() => {
    if (session.activity?.status === "awaiting_input") {
      markActivityNeedsInput(activityId)
      toast.message("Athena needs your input", {
        description: session.activity.name,
        action: {
          label: "Open",
          onClick: () => {
            window.location.href = `/activities/${activityId}`
          },
        },
      })
      return
    }

    if (session.activity?.status === "completed") {
      clearActivityNeedsInput(activityId)
    }
  }, [
    activityId,
    clearActivityNeedsInput,
    markActivityNeedsInput,
    session.activity?.name,
    session.activity?.status,
  ])

  return null
}

export function useSessionRegistry() {
  const context = useContext(SessionRegistryContext)
  if (!context) {
    throw new Error("useSessionRegistry must be used within SessionRegistryProvider")
  }
  return context
}
