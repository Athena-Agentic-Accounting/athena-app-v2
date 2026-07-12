"use client"

import { useMemo, useState } from "react"
import { RiHomeLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

import { ChatPromptBar, type PromptMode } from "@/components/chat/chat-prompt-bar"
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble"
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator"
import { HomeAttentionList } from "@/components/home/home-attention-list"
import { HomeStatusCards } from "@/components/home/home-status-cards"
import { useActivityBoard } from "@/components/providers/activity-board-provider"
import { useClient } from "@/components/providers/client-provider"
import { PageHeader } from "@/components/shell/page-header"
import { Spinner } from "@/components/ui/spinner"
import { submitActivityPrompt } from "@/lib/api/activities"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import type { ChecklistTask, TaskStatus } from "@/lib/checklist/mock-tasks"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"

function greetingName(user: ReturnType<typeof useUser>["user"]) {
  if (user?.firstName) return user.firstName
  if (user?.fullName) return user.fullName.split(" ")[0]
  return "there"
}

function countByStatus(tasks: ChecklistTask[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status).length
}

function resolvePromptClientId(
  selectedClientId: string,
  clients: { id: string }[],
): string | null {
  if (selectedClientId !== ALL_CLIENTS_ID) return selectedClientId
  const firstRealClient = clients.find((client) => client.id !== ALL_CLIENTS_ID)
  return firstRealClient?.id ?? null
}

export function HomeView() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user } = useUser()
  const { tasks, isLoading } = useActivityBoard()
  const { selectedClientId, clients, source: clientSource } = useClient()
  const [submittingPrompt, setSubmittingPrompt] = useState(false)
  const [messages, setMessages] = useState<SessionChatMessage[]>([])

  const statusCounts = useMemo(
    (): Record<TaskStatus, number> => ({
      "needs-action": countByStatus(tasks, "needs-action"),
      "to-do": countByStatus(tasks, "to-do"),
      "in-review": countByStatus(tasks, "in-review"),
      complete: countByStatus(tasks, "complete"),
    }),
    [tasks],
  )

  async function handlePromptSubmit(message: string, mode: PromptMode) {
    if (clientSource !== "api") {
      toast.error("Clients are still loading", {
        description: "Give it a moment and try again.",
      })
      return
    }

    const clientId = resolvePromptClientId(selectedClientId, clients)
    if (!clientId) {
      toast.error("Select a client first", {
        description: "Choose a client in the sidebar before starting work.",
      })
      return
    }

    // Show the question in the thread immediately.
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ])
    setSubmittingPrompt(true)
    let navigated = false

    try {
      const token = await getToken()
      const response = await submitActivityPrompt(token, { clientId, prompt: message, mode })

      const activityId = response.activity?.id
      if (activityId && (response.kind === "activity_proposed" || response.kind === "activity_created")) {
        navigated = true
        router.push(`/activities/${activityId}?prompt=${encodeURIComponent(message)}`)
        return
      }

      if (activityId) {
        navigated = true
        router.push(`/activities/${activityId}`)
        return
      }

      const inlineAnswer =
        response.answer ?? response.message ?? response.content ?? null

      if (inlineAnswer) {
        setMessages((prev) => [
          ...prev,
          { id: `assistant-${Date.now()}`, role: "assistant", content: inlineAnswer },
        ])
        return
      }

      toast.success("Prompt sent")
    } catch (err) {
      toast.error("Could not send prompt", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      if (!navigated) setSubmittingPrompt(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Home"
        icon={RiHomeLine}
        showSearch={false}
        showNotifications
        actionLabel="View Issues board"
        actionHref="/board"
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        <div className="flex w-full flex-col gap-8 px-5 py-8">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Hello {greetingName(user)}
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask anything or start a task — questions, close work, and approvals all start here.
              </p>
            </div>

            {messages.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {submittingPrompt ? <ChatTypingIndicator /> : null}
              </div>
            ) : null}

            <div className="relative">
              <ChatPromptBar
                onSubmit={(message, mode) => void handlePromptSubmit(message, mode)}
              />
              {submittingPrompt && messages.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
                  <Spinner className="size-4 text-muted-foreground" />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Activity status</h2>
            <HomeStatusCards counts={statusCounts} isLoading={isLoading} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Needs your attention</h2>
            <HomeAttentionList />
          </section>
        </div>
      </div>
    </div>
  )
}
