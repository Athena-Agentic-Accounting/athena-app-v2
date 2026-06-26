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

import { useClient } from "@/components/providers/client-provider"
import {
  decideApproval,
  getApprovalQueue,
  type ApprovalQueueItem,
} from "@/lib/api/approvals"
import { mapApprovalQueueToAttention } from "@/lib/approvals/map-queue-to-attention"
import type { HomeAttentionItem } from "@/lib/approvals/map-queue-to-attention"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"
import type { ApprovalDecision } from "@/lib/genui/types"

type ApprovalQueueContextValue = {
  items: HomeAttentionItem[]
  rawItems: ApprovalQueueItem[]
  isLoading: boolean
  refreshQueue: () => Promise<void>
  decide: (
    gateId: string,
    payload: {
      decision: ApprovalDecision
      notes?: string
      editedPayload?: Record<string, unknown>
    },
  ) => Promise<void>
}

const ApprovalQueueContext = createContext<ApprovalQueueContextValue | null>(null)

export function ApprovalQueueProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  const { selectedClientId, isLoaded: clientLoaded } = useClient()
  const [rawItems, setRawItems] = useState<ApprovalQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const clientFilter =
    selectedClientId !== ALL_CLIENTS_ID ? selectedClientId : null

  const refreshQueue = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      const queue = await getApprovalQueue(token, {
        clientId: clientFilter,
        status: "pending",
      })
      setRawItems(queue)
    } catch {
      setRawItems([])
    } finally {
      setIsLoading(false)
    }
  }, [clientFilter, getToken])

  useEffect(() => {
    if (!clientLoaded) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const token = await getToken()
        const queue = await getApprovalQueue(token, {
          clientId: clientFilter,
          status: "pending",
        })
        if (cancelled) return
        setRawItems(queue)
      } catch {
        if (!cancelled) setRawItems([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [clientFilter, clientLoaded, getToken])

  const decide = useCallback(
    async (
      gateId: string,
      payload: {
        decision: ApprovalDecision
        notes?: string
        editedPayload?: Record<string, unknown>
      },
    ) => {
      const token = await getToken()
      await decideApproval(token, gateId, payload)
      setRawItems((current) =>
        current.filter((item) => (item.gateId ?? item.id) !== gateId),
      )
    },
    [getToken],
  )

  const items = useMemo(() => mapApprovalQueueToAttention(rawItems), [rawItems])

  return (
    <ApprovalQueueContext.Provider
      value={{
        items,
        rawItems,
        isLoading,
        refreshQueue,
        decide,
      }}
    >
      {children}
    </ApprovalQueueContext.Provider>
  )
}

export function useApprovalQueue() {
  const context = useContext(ApprovalQueueContext)
  if (!context) {
    throw new Error("useApprovalQueue must be used within ApprovalQueueProvider")
  }
  return context
}
