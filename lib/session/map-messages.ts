import type { ActivityMessage } from "@/lib/activities/types"

export type SessionChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export function mapActivityMessages(messages: ActivityMessage[]): SessionChatMessage[] {
  return messages
    .filter((message) => {
      // If the message is already represented as a GenUI structured event, do not render as raw text bubble
      if (message.structured || message.structured_) {
        return false
      }
      return true
    })
    .map((message, index) => ({
      id: message.id ?? `message-${index}`,
      role: normalizeRole(message.role),
      content: (message.content ?? message.text ?? message.body ?? "").trim(),
      createdAt: message.createdAt ?? message.created_at,
    }))
    .filter((message) => {
      if (!message.content) return false
      // Filter out redundant assistant plan step dumps or raw JSON stubs
      const lower = message.content.toLowerCase()
      if (message.role === "assistant" && (lower.startsWith("proposed plan") || lower.startsWith("```json"))) {
        return false
      }
      return message.content.length > 0
    })
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
