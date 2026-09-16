"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  getCoa,
  parseCoaPreview,
  uploadCoa,
  type CoaPreviewRow,
  type CoaRecord,
} from "@/lib/api/coa"
import {
  buildAthenaMetadataUpdate,
  getAthenaMetadata,
  getPrimaryClientName,
} from "@/lib/athena/user-metadata"

type WelcomeCheckSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

type CoaState =
  | { phase: "loading" }
  | { phase: "missing" }
  | { phase: "ready"; record: CoaRecord; rows: CoaPreviewRow[] | null }
  | { phase: "error"; message: string }

export function WelcomeCheckSheet({
  open,
  onOpenChange,
  onComplete,
}: WelcomeCheckSheetProps) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [coa, setCoa] = useState<CoaState>({ phase: "loading" })
  const [visibleRows, setVisibleRows] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clientName = getPrimaryClientName(
    getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
  )

  // Closing the sheet discards the preview so the next open starts fresh.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) {
      setCoa({ phase: "loading" })
      setVisibleRows(0)
    }
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false

    void (async () => {
      try {
        const token = await getToken()
        const record = await getCoa(token)
        if (cancelled) return

        if (!record) {
          setCoa({ phase: "missing" })
          return
        }

        let rows: CoaPreviewRow[] | null = null
        try {
          const response = await fetch(record.publicUrl)
          if (response.ok) rows = parseCoaPreview(await response.text())
        } catch {
          // Preview is best-effort; the metadata card covers non-CSV files.
        }
        if (!cancelled) setCoa({ phase: "ready", record, rows })
      } catch (err) {
        if (!cancelled) {
          setCoa({
            phase: "error",
            message:
              err instanceof Error ? err.message : "Could not load the chart of accounts.",
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, getToken])

  const previewRows = coa.phase === "ready" ? coa.rows : null

  useEffect(() => {
    if (!open || !previewRows) return
    if (visibleRows >= previewRows.length) return

    const rowTimer = window.setTimeout(() => {
      setVisibleRows((count) => count + 1)
    }, 220)

    return () => window.clearTimeout(rowTimer)
  }, [open, previewRows, visibleRows])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const token = await getToken()
      await uploadCoa(token, file)
      toast.success("Chart of accounts uploaded")
      setVisibleRows(0)
      setCoa({ phase: "loading" })
      const record = await getCoa(token)
      if (record) {
        let rows: CoaPreviewRow[] | null = null
        try {
          const response = await fetch(record.publicUrl)
          if (response.ok) rows = parseCoaPreview(await response.text())
        } catch {
          // metadata card fallback
        }
        setCoa({ phase: "ready", record, rows })
      } else {
        setCoa({ phase: "missing" })
      }
    } catch (err) {
      toast.error("Could not upload the chart of accounts", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
      setCoa({ phase: "missing" })
    } finally {
      setUploading(false)
    }
  }

  async function handleComplete() {
    if (!user) return
    setSaving(true)
    try {
      await user.update({
        unsafeMetadata: buildAthenaMetadataUpdate(user.unsafeMetadata, {
          onboardingJustCompleted: false,
          institution: {
            welcomeCheckCompleted: true,
          },
        }),
      })
      onOpenChange(false)
      onComplete?.()
    } finally {
      setSaving(false)
    }
  }

  const rowsFullyRevealed = !previewRows || visibleRows >= previewRows.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-normal">Welcome Check — {clientName}</SheetTitle>
          <SheetDescription>
            LUCA is reading your connected data for the first time.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-auto px-4 pb-6">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {coa.phase === "loading" ? (
              <>
                <Spinner className="size-4" />
                Checking your chart of accounts…
              </>
            ) : coa.phase === "ready" ? (
              "Connected. Reviewing accounts and recent activity."
            ) : coa.phase === "missing" ? (
              "No chart of accounts on file yet."
            ) : (
              coa.message
            )}
          </div>

          {coa.phase === "missing" ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Upload your firm&apos;s chart of accounts (CSV) so LUCA can map
                transactions to the right accounts.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleUpload(file)
                  event.target.value = ""
                }}
              />
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Uploading…
                  </>
                ) : (
                  "Upload chart of accounts"
                )}
              </Button>
            </div>
          ) : null}

          {coa.phase === "ready" ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Chart of accounts</p>
              {coa.rows ? (
                <div className="overflow-hidden rounded-xl border border-border/70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-normal">Code</th>
                        <th className="px-3 py-2 font-normal">Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coa.rows.slice(0, visibleRows).map((row) => (
                        <tr key={`${row.code}-${row.name}`} className="border-t border-border/60">
                          <td className="px-3 py-2 text-muted-foreground">{row.code}</td>
                          <td className="px-3 py-2 text-foreground">{row.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
                  <p className="text-foreground">{coa.record.fileName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Version {coa.record.version}
                    {coa.record.uploadedAt
                      ? ` · uploaded ${new Date(coa.record.uploadedAt).toLocaleDateString()}`
                      : null}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {coa.phase !== "loading" ? (
            <Button
              className="mt-auto w-full"
              disabled={saving || uploading || !rowsFullyRevealed}
              onClick={handleComplete}
            >
              {saving ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Finishing…
                </>
              ) : (
                "Done — show me my workspace"
              )}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
