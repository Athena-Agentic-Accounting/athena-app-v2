"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownContentProps = {
  markdown: string
  className?: string
}

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h1:tracking-tight prose-h2:mt-8 prose-h2:text-base prose-p:leading-relaxed prose-li:my-1 prose-strong:font-semibold prose-table:text-sm",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
