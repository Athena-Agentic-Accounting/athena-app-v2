"use client"

import type { AttentionCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"

export function AttentionCard({ data }: { data: AttentionCardData }) {
  return (
    <CardShell type="attention_required" title={getCardTitle("attention_required", data.title)}>
      <p className="text-sm font-medium text-foreground">{data.reason}</p>
      {data.detail ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.detail}</p>
      ) : null}
    </CardShell>
  )
}
