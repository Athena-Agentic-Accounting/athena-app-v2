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
import { useAuth, useUser } from "@clerk/nextjs"

import { useClient } from "@/components/providers/client-provider"
import {
  getBoardCountsFromTasks,
  mapBoardToChecklistTasks,
} from "@/lib/activities/map-board-to-checklist"
import { getActivityBoard } from "@/lib/api/activities"
import { getAthenaMetadata } from "@/lib/athena/user-metadata"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import type { ChecklistTask } from "@/lib/checklist/mock-tasks"

type ActivityBoardContextValue = {
  tasks: ChecklistTask[]
  allCount: number
  assignedCount: number
  isLoading: boolean
  refreshBoard: () => Promise<void>
}

const ActivityBoardContext = createContext<ActivityBoardContextValue | null>(null)

export function ActivityBoardProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken } = useAuth()
  const { selectedClientId, isLoaded: clientLoaded } = useClient()
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const meta = useMemo(
    () =>
      getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
    [user?.unsafeMetadata],
  )

  const clientFilter =
    selectedClientId !== ALL_CLIENTS_ID ? selectedClientId : null

  const counts = useMemo(() => getBoardCountsFromTasks(tasks), [tasks])

  const refreshBoard = useCallback(async () => {
    if (!meta?.onboardingComplete) {
      setTasks([])
      return
    }

    setIsLoading(true)
    try {
      const token = await getToken()
      const board = await getActivityBoard(token, clientFilter)
      setTasks(mapBoardToChecklistTasks(board))
    } catch {
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [clientFilter, getToken, meta?.onboardingComplete])

  useEffect(() => {
    if (!userLoaded || !clientLoaded) return

    let cancelled = false

    async function load() {
      if (!meta?.onboardingComplete) {
        if (!cancelled) setTasks([])
        return
      }

      if (!cancelled) setIsLoading(true)
      try {
        const token = await getToken()
        const board = await getActivityBoard(token, clientFilter)
        if (cancelled) return
        setTasks(mapBoardToChecklistTasks(board))
      } catch {
        if (!cancelled) setTasks([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [clientFilter, clientLoaded, getToken, meta?.onboardingComplete, userLoaded])

  return (
    <ActivityBoardContext.Provider
      value={{
        tasks,
        allCount: counts.allCount,
        assignedCount: counts.assignedCount,
        isLoading,
        refreshBoard,
      }}
    >
      {children}
    </ActivityBoardContext.Provider>
  )
}

export function useActivityBoard() {
  const context = useContext(ActivityBoardContext)
  if (!context) {
    throw new Error("useActivityBoard must be used within ActivityBoardProvider")
  }
  return context
}
