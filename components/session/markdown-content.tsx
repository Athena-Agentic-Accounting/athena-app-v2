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
      data-official-content
      className={cn(
        "prose prose-sm prose-neutral dark:prose-invert font-document max-w-none text-foreground prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:mb-5 prose-h1:text-[26px] prose-h2:mt-9 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:text-[17px] prose-h3:mt-7 prose-h3:text-[15px] prose-p:text-pretty prose-p:leading-6 prose-p:text-foreground/85 prose-a:font-medium prose-a:text-primary prose-a:decoration-primary/30 prose-a:underline-offset-4 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-li:my-1 prose-li:text-foreground/85 prose-strong:font-semibold prose-strong:text-foreground prose-code:border prose-code:border-border prose-code:bg-muted/40 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.88em] prose-code:font-normal prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border prose-pre:bg-muted/30 prose-pre:text-foreground prose-table:my-5 prose-table:border-collapse prose-table:border prose-table:border-border prose-table:text-[13px] prose-thead:border-b-0 prose-th:border prose-th:border-border prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-[10px] prose-th:font-semibold prose-th:uppercase prose-th:tracking-[0.08em] prose-th:text-muted-foreground prose-td:border prose-td:border-border/80 prose-td:px-3 prose-td:py-2.5 prose-td:align-top",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
