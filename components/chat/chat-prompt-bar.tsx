"use client"

import { useRef, useState } from "react"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowUpLine,
  RiMicLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type PromptMode = "default" | "query"

type ChatPromptBarProps = {
  placeholder?: string
  className?: string
  onSubmit?: (message: string, mode: PromptMode) => void
}

const MODE_LABELS: Record<PromptMode, string> = {
  default: "Default",
  query: "Quick question",
}

export function ChatPromptBar({
  placeholder = "Ask anything or start a task…",
  className,
  onSubmit,
}: ChatPromptBarProps) {
  const [value, setValue] = useState("")
  const [mode, setMode] = useState<PromptMode>("default")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit?.(trimmed, mode)
    setValue("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-3",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder={placeholder}
        aria-label="Message Athena"
        className="min-h-[56px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Add attachment"
          >
            <RiAddLine className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs font-normal"
              >
                {MODE_LABELS[mode]}
                <RiArrowDownSLine className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setMode("default")}>
                Default
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("default")}>
                Start a close task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("query")}>
                Quick question
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Voice input"
          >
            <RiMicLine className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            className="rounded-full"
            aria-label="Send message"
            disabled={!value.trim()}
            onClick={handleSubmit}
          >
            <RiArrowUpLine className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
