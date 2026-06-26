"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import type { NarrativeCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { cn } from "@/lib/utils"

export function NarrativeCard({ data }: { data: NarrativeCardData }) {
  return (
    <CardShell type="narrative" title={getCardTitle("narrative", data.title)}>
      <div
        className={cn(
          "prose prose-sm max-w-none text-foreground prose-headings:font-medium prose-p:leading-relaxed prose-li:my-0.5 prose-table:text-sm",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.markdown}</ReactMarkdown>
      </div>
    </CardShell>
  )
}
