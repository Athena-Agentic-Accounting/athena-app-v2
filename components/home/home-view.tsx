"use client"

import { useMemo, useState } from "react"
import { RiHomeLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
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
import type { UploadedAttachment } from "@/lib/api/uploads"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import type { ChecklistTask, TaskStatus } from "@/lib/checklist/mock-tasks"
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients"

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

/** Muted label + rule. Separates sections without competing with content. */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[13px] font-normal text-muted-foreground">
        {label}
      </h2>
      <div aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}

export function HomeView() {
  const router = useRouter()
  const { getToken } = useAuth()
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

  async function handlePromptSubmit(
    message: string,
    mode: PromptMode,
    attachments?: UploadedAttachment[],
  ) {
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
      const response = await submitActivityPrompt(token, {
        clientId,
        prompt: message,
        mode,
        fileIds: attachments?.map((file) => file.id),
      })

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
        {/* Composer and its results share one 760px measure, so the input and
            everything it produces sit on the same optical spine. */}
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10 px-6 pb-16 pt-14">
          <section className="flex flex-col gap-6">
            <h2 className="text-[28px] font-normal leading-8 tracking-[-0.02em] text-foreground">
              Start a task
            </h2>

            {messages.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-4">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {submittingPrompt ? <ChatTypingIndicator /> : null}
              </div>
            ) : null}

            <div className="relative">
              <ChatPromptBar
                placeholder="Describe a task, or ask a question…"
                clientId={resolvePromptClientId(selectedClientId, clients) ?? undefined}
                onSubmit={(message, mode, attachments) =>
                  void handlePromptSubmit(message, mode, attachments)
                }
              />
              {submittingPrompt && messages.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
                  <Spinner className="size-4 text-muted-foreground" />
                </div>
              ) : null}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader label="Activity" />
            <HomeStatusCards counts={statusCounts} isLoading={isLoading} />
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader label="Needs your attention" />
            <HomeAttentionList />
          </section>
        </div>
      </div>
    </div>
  )
}
