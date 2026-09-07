"use client"

import { MarkdownContent } from "@/components/session/markdown-content"
import type { SessionChatMessage } from "@/lib/session/map-messages"

type ChatMessageBubbleProps = {
  message: SessionChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"

  if (!isUser) {
    return (
      <article data-chat-interface className="w-full px-1">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Athena
        </p>
        <div className="text-sm leading-relaxed text-foreground">
          <MarkdownContent markdown={message.content} />
        </div>
      </article>
    )
  }

  return (
    <div data-chat-interface className="flex w-full justify-end">
      <div
        className="max-w-[85%] rounded-xl rounded-br-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
