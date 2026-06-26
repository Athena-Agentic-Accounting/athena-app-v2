"use client"

import { RiCheckboxBlankCircleLine, RiCheckboxCircleLine } from "@remixicon/react"

import type { ChecklistCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { cn } from "@/lib/utils"

export function ChecklistCard({ data }: { data: ChecklistCardData }) {
  return (
    <CardShell type="checklist" title={getCardTitle("checklist", data.title)}>
      <ul className="space-y-3">
        {data.items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex gap-2">
            {item.done ? (
              <RiCheckboxCircleLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <RiCheckboxBlankCircleLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className={cn("text-sm", item.done ? "text-muted-foreground" : "text-foreground")}>
                {item.label}
              </p>
              {item.detail ? (
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  )
}
