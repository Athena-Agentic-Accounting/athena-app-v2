"use client"

import { RiExternalLinkLine, RiFileExcelLine, RiFileTextLine } from "@remixicon/react"

import type { FileCreatedCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { Button } from "@/components/ui/button"

function getFileIcon(mimeType?: string) {
  if (!mimeType) return RiFileTextLine
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return RiFileExcelLine
  if (mimeType.includes("word") || mimeType.includes("document")) return RiFileTextLine
  return RiFileTextLine
}

export function FileCreatedCard({ data }: { data: FileCreatedCardData }) {
  const FileIcon = getFileIcon(data.mimeType)

  return (
    <CardShell type="file_created" title={getCardTitle("file_created", data.title)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-medium text-foreground">{data.fileName}</p>
          </div>
          {data.location ? (
            <p className="mt-1 text-xs text-muted-foreground">Saved to: {data.location}</p>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs">
          <a href={data.fileUrl} target="_blank" rel="noreferrer">
            Open in Drive
            <RiExternalLinkLine className="size-3.5" />
          </a>
        </Button>
      </div>
    </CardShell>
  )
}
