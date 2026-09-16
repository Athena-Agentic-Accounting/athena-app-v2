"use client"

import { useState } from "react"
import {
  RiDownloadLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileExcelLine,
  RiFileTextLine,
} from "@remixicon/react"

import type { FileCreatedCardData } from "@/lib/genui/types"
import { getCardTitle } from "@/lib/genui/card-meta"
import { CardShell } from "@/components/genui/card-shell"
import { Button } from "@/components/ui/button"

function FileTypeIcon({ mimeType, className }: { mimeType?: string; className?: string }) {
  if (mimeType && (mimeType.includes("sheet") || mimeType.includes("excel"))) {
    return <RiFileExcelLine className={className} />
  }
  return <RiFileTextLine className={className} />
}

function getEmbedPreviewUrl(fileUrl?: string): string | null {
  if (!fileUrl) return null

  // 1. Google Sheets: docs.google.com/spreadsheets/d/<id>/...
  const sheetsMatch = fileUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (sheetsMatch?.[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview?widget=true&headers=true`
  }

  // 2. Google Drive file: drive.google.com/file/d/<id>/...
  const driveFileMatch = fileUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`
  }

  // 3. Google Drive open?id=<id> or uc?id=<id>
  const driveIdMatch = fileUrl.match(/drive\.google\.com\/(?:open|uc)\?id=([a-zA-Z0-9_-]+)/)
  if (driveIdMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`
  }

  // 4. Public HTTPS URL for Office/Excel/PDF documents
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }

  return null
}

export function FileCreatedCard({ data }: { data: FileCreatedCardData }) {
  const [showPreview, setShowPreview] = useState(true)
  const previewUrl = getEmbedPreviewUrl(data.fileUrl)
  const isDrive =
    data.fileUrl?.includes("drive.google.com") ||
    data.fileUrl?.includes("docs.google.com") ||
    data.location?.toLowerCase().includes("drive")

  return (
    <CardShell type="file_created" title={getCardTitle("file_created", data.title)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileTypeIcon mimeType={data.mimeType} className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate text-sm font-medium text-foreground">{data.fileName}</p>
            </div>
            {data.location ? (
              <p className="mt-1 text-xs text-muted-foreground">Saved to: {data.location}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowPreview((prev) => !prev)}
              >
                {showPreview ? (
                  <>
                    <RiEyeOffLine className="size-3.5" />
                    Hide preview
                  </>
                ) : (
                  <>
                    <RiEyeLine className="size-3.5" />
                    Show preview
                  </>
                )}
              </Button>
            ) : null}

            {data.fileUrl ? (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <a href={data.fileUrl} target="_blank" rel="noreferrer">
                  {isDrive ? "Open in Drive" : "Download"}
                  {isDrive ? (
                    <RiExternalLinkLine className="size-3.5" />
                  ) : (
                    <RiDownloadLine className="size-3.5" />
                  )}
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        {previewUrl && showPreview ? (
          <div className="relative flex flex-col overflow-hidden rounded-lg border border-border/70 bg-background shadow-xs">
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Preview</span>
              {data.fileUrl ? (
                <a
                  href={data.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Open in separate tab
                  <RiExternalLinkLine className="size-3" />
                </a>
              ) : null}
            </div>

            <div className="relative h-[520px] w-full bg-muted/10">
              <iframe
                src={previewUrl}
                title={`Preview of ${data.fileName}`}
                className="h-full w-full border-0"
                allow="autoplay"
                loading="lazy"
              />
            </div>
          </div>
        ) : null}
      </div>
    </CardShell>
  )
}
