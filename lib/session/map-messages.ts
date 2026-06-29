import type { ActivityMessage } from "@/lib/activities/types"

export type SessionChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function mapActivityMessages(messages: ActivityMessage[]): SessionChatMessage[] {
  return messages
    .map((message, index) => ({
      id: message.id ?? `message-${index}`,
      role: normalizeRole(message.role),
      content: (message.content ?? message.text ?? message.body ?? "").trim(),
    }))
    .filter((message) => message.content.length > 0)
}

function normalizeRole(role?: string): SessionChatMessage["role"] {
  if (!role) return "assistant"
  if (role === "user" || role === "human" || role === "accountant") return "user"
  return "assistant"
}

export function sortMessagesByCreatedAt(messages: ActivityMessage[]): ActivityMessage[] {
  return [...messages].sort((a, b) => {
    const aTime = Date.parse(a.createdAt ?? a.created_at ?? "")
    const bTime = Date.parse(b.createdAt ?? b.created_at ?? "")
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0
    return aTime - bTime
  })
}
