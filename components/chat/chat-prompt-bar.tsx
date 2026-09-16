"use client"

import { useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowUpLine,
  RiCloseLine,
  RiFileLine,
  RiMicLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import {
  ATTACHMENT_ACCEPT,
  uploadPromptAttachment,
  type UploadedAttachment,
} from "@/lib/api/uploads"
import { cn } from "@/lib/utils"

export type PromptMode = "default" | "query"

type ChatPromptBarProps = {
  placeholder?: string
  className?: string
  /** Scopes uploaded attachments to a client. Attachment UI is hidden without it. */
  clientId?: string
  onSubmit?: (
    message: string,
    mode: PromptMode,
    attachments?: UploadedAttachment[],
  ) => void
}

const MODE_LABELS: Record<PromptMode, string> = {
  default: "Default",
  query: "Quick question",
}

export function ChatPromptBar({
  placeholder = "Ask anything or start a task…",
  className,
  clientId,
  onSubmit,
}: ChatPromptBarProps) {
  const { getToken } = useAuth()
  const [value, setValue] = useState("")
  const [mode, setMode] = useState<PromptMode>("default")
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Files upload as soon as they're picked, so submitting only has to pass ids.
  async function handleFilePicked(file: File) {
    setUploading(true)
    try {
      const token = await getToken()
      const uploaded = await uploadPromptAttachment(token, file, clientId)
      setAttachments((current) => [...current, uploaded])
    } catch (err) {
      toast.error("Could not attach that file", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit?.(trimmed, mode, attachments.length ? attachments : undefined)
    setValue("")
    setAttachments([])
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      data-chat-interface
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
        aria-label="Message LUCA"
        className="min-h-[56px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
      />

      {attachments.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 py-1 pr-1 pl-2 text-xs"
            >
              <RiFileLine className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[16rem] truncate">{file.fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-5 text-muted-foreground"
                aria-label={`Remove ${file.fileName}`}
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== file.id),
                  )
                }
              >
                <RiCloseLine className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFilePicked(file)
              event.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Add attachment"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Spinner className="size-4" />
            ) : (
              <RiAddLine className="size-4" />
            )}
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
            <DropdownMenuContent data-chat-interface align="start">
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
