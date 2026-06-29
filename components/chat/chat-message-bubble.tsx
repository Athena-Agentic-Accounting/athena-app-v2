"use client"

import { MarkdownContent } from "@/components/session/markdown-content"
import type { SessionChatMessage } from "@/lib/session/map-messages"
import { cn } from "@/lib/utils"

type ChatMessageBubbleProps = {
  message: SessionChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(85%,42rem)] text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-foreground"
            : "rounded-2xl rounded-bl-md border border-border/60 bg-background px-4 py-3 text-foreground shadow-xs",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownContent markdown={message.content} />
        )}
      </div>
    </div>
  )
}
