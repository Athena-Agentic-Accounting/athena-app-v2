"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { buildAthenaMetadataUpdate, getAthenaMetadata, getPrimaryClientName } from "@/lib/athena/user-metadata"

const MOCK_COA_ROWS = [
  { code: "1000", name: "Operating Cash" },
  { code: "1010", name: "Payroll Cash" },
  { code: "1200", name: "Accounts Receivable" },
  { code: "2000", name: "Accounts Payable" },
  { code: "4000", name: "Service Revenue" },
  { code: "6100", name: "Payroll Expense" },
]

type WelcomeCheckSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function WelcomeCheckSheet({
  open,
  onOpenChange,
  onComplete,
}: WelcomeCheckSheetProps) {
  const { user } = useUser()
  const [phase, setPhase] = useState<"loading" | "ready">("loading")
  const [visibleRows, setVisibleRows] = useState(0)
  const [saving, setSaving] = useState(false)

  const clientName = getPrimaryClientName(
    getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
  )

  useEffect(() => {
    if (!open) {
      setPhase("loading")
      setVisibleRows(0)
      return
    }

    const readyTimer = window.setTimeout(() => setPhase("ready"), 1800)
    return () => window.clearTimeout(readyTimer)
  }, [open])

  useEffect(() => {
    if (!open || phase !== "ready") return

    if (visibleRows >= MOCK_COA_ROWS.length) return

    const rowTimer = window.setTimeout(() => {
      setVisibleRows((count) => count + 1)
    }, 220)

    return () => window.clearTimeout(rowTimer)
  }, [open, phase, visibleRows])

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-normal">Welcome Check — {clientName}</SheetTitle>
          <SheetDescription>
            Athena is reading your connected data for the first time.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-auto px-4 pb-6">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {phase === "loading" ? (
              <>
                <Spinner className="size-4" />
                Reading your QuickBooks data…
              </>
            ) : (
              "Connected. Reviewing accounts and recent activity."
            )}
          </div>

          {phase === "ready" ? (
            <>
              <div className="rounded-xl border border-border/70 bg-card p-4 text-sm leading-relaxed text-foreground">
                Connected. I can see 1,247 transactions, $340K cash across 2 accounts, and
                your chart of accounts. I&apos;m ready to help with your next close.
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Chart of accounts preview</p>
                <div className="overflow-hidden rounded-xl border border-border/70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-normal">Code</th>
                        <th className="px-3 py-2 font-normal">Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_COA_ROWS.slice(0, visibleRows).map((row) => (
                        <tr key={row.code} className="border-t border-border/60">
                          <td className="px-3 py-2 text-muted-foreground">{row.code}</td>
                          <td className="px-3 py-2 text-foreground">{row.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                className="mt-auto w-full"
                disabled={visibleRows < MOCK_COA_ROWS.length || saving}
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
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
