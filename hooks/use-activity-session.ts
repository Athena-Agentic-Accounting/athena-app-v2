"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import {
  confirmActivityPlan,
  getActivity,
  getActivityMessages,
  postActivityMessage,
  subscribeActivityStream,
} from "@/lib/api/activities"
import { decideApproval } from "@/lib/api/approvals"
import type { ActivityRecord } from "@/lib/activities/types"
import type { ActivityStreamEvent, PlanReviewDecision } from "@/lib/genui/types"
import {
  buildArtifactFromStreamEvents,
  extractThoughtsFromStream,
} from "@/lib/session/build-artifact-from-stream"
import {
  mapActivityMessages,
  sortMessagesByCreatedAt,
  type SessionChatMessage,
} from "@/lib/session/map-messages"
import { mergeStreamEvents, parseStreamEvent } from "@/lib/session/parse-stream-event"

type StreamStatus = "idle" | "connecting" | "connected" | "error"

export function useActivitySession(activityId: string, initialPrompt?: string | null) {
  const { getToken } = useAuth()
  const [activity, setActivity] = useState<ActivityRecord | null>(null)
  const [messages, setMessages] = useState<SessionChatMessage[]>([])
  const [streamEvents, setStreamEvents] = useState<ActivityStreamEvent[]>([])
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [initialPromptSent, setInitialPromptSent] = useState(false)

  const activityIdRef = useRef(activityId)
  activityIdRef.current = activityId

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const token = await getToken()
        if (cancelled) return

        const [record, rawMessages] = await Promise.all([
          getActivity(token, activityIdRef.current),
          getActivityMessages(token, activityIdRef.current),
        ])
        if (cancelled) return

        setActivity(record)
        setMessages(mapActivityMessages(sortMessagesByCreatedAt(rawMessages)))
      } catch (err) {
        if (!cancelled) {
          toast.error("Could not load activity session", {
            description: err instanceof Error ? err.message : "Something went wrong.",
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [activityId, getToken])

  useEffect(() => {
    if (!initialPrompt || initialPromptSent || isLoading) return

    if (messages.some((message) => message.role === "user")) {
      setInitialPromptSent(true)
      return
    }

    const prompt = initialPrompt.trim()
    if (!prompt) return

    let cancelled = false

    async function sendInitialPrompt() {
      try {
        const token = await getToken()
        if (cancelled) return

        await postActivityMessage(token, activityIdRef.current, prompt)
        if (cancelled) return

        setInitialPromptSent(true)
        const items = sortMessagesByCreatedAt(
          await getActivityMessages(token, activityIdRef.current),
        )
        if (cancelled) return
        setMessages(mapActivityMessages(items))
      } catch {
        if (!cancelled) {
          toast.error("Could not send initial prompt")
        }
      }
    }

    void sendInitialPrompt()
    return () => {
      cancelled = true
    }
  }, [activityId, getToken, initialPrompt, initialPromptSent, isLoading, messages])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    async function connect() {
      setStreamStatus("connecting")
      const token = await getToken()
      if (cancelled) return

      unsubscribe = subscribeActivityStream(token, activityIdRef.current, {
        onOpen: () => {
          if (!cancelled) setStreamStatus("connected")
        },
        onEvent: (raw) => {
          if (cancelled) return
          const parsed = parseStreamEvent(raw, activityIdRef.current)
          if (!parsed) return
          setStreamEvents((current) => mergeStreamEvents(current, parsed))
        },
        onError: () => {
          if (!cancelled) setStreamStatus("error")
        },
      })
    }

    void connect()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [activityId, getToken])

  const artifact = useMemo(
    () => buildArtifactFromStreamEvents(streamEvents),
    [streamEvents],
  )

  const thoughts = useMemo(
    () => extractThoughtsFromStream(streamEvents),
    [streamEvents],
  )

  const refreshMessages = useCallback(async () => {
    const token = await getToken()
    const items = sortMessagesByCreatedAt(
      await getActivityMessages(token, activityIdRef.current),
    )
    setMessages(mapActivityMessages(items))
  }, [getToken])

  const refreshActivity = useCallback(async () => {
    const token = await getToken()
    const record = await getActivity(token, activityIdRef.current)
    setActivity(record)
  }, [getToken])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const optimisticId = `optimistic-${Date.now()}`
      setMessages((current) => [
        ...current,
        { id: optimisticId, role: "user", content: trimmed },
      ])
      setIsSending(true)

      try {
        const token = await getToken()
        await postActivityMessage(token, activityIdRef.current, trimmed)
        await refreshMessages()
      } catch (err) {
        setMessages((current) => current.filter((message) => message.id !== optimisticId))
        toast.error("Could not send message", {
          description: err instanceof Error ? err.message : "Something went wrong.",
        })
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [getToken, refreshMessages],
  )

  const handlePlanDecision = useCallback(
    async (decision: PlanReviewDecision, gateId?: string) => {
      const token = await getToken()

      if (decision === "start_now") {
        await confirmActivityPlan(token, activityIdRef.current)
        toast.success("Plan confirmed — execution started")
        await refreshActivity()
        return
      }

      if (decision === "reject" && gateId) {
        await decideApproval(token, gateId, { decision: "reject" })
        toast.success("Plan rejected")
        return
      }

      if (decision === "save") {
        toast.success("Changes saved locally")
        return
      }

      if (decision === "schedule") {
        toast.message("Plan scheduled", {
          description: "Scheduling will be available in a follow-up release.",
        })
      }
    },
    [getToken, refreshActivity],
  )

  const handleApprovalDecision = useCallback(
    async (
      gateId: string,
      payload: {
        decision: "approve" | "reject" | "edit"
        notes?: string
        editedPayload?: Record<string, unknown>
      },
    ) => {
      const token = await getToken()
      await decideApproval(token, gateId, payload)
      setStreamEvents((current) =>
        current.filter((event) => {
          if (event.event.type !== "approval_gate") return true
          return event.event.data.gateId !== gateId
        }),
      )
      toast.success("Decision recorded")
    },
    [getToken],
  )

  return {
    activity,
    artifact,
    thoughts,
    messages,
    streamEvents,
    streamStatus,
    isLoading,
    isSending,
    sendMessage,
    handlePlanDecision,
    handleApprovalDecision,
    refreshMessages,
    refreshActivity,
  }
}

export type UseActivitySessionReturn = ReturnType<typeof useActivitySession>
