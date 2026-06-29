"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  getIntegrationLabel,
} from "@/lib/integrations/connect-integration"
import type { OAuthCallbackMessage } from "@/lib/integrations/oauth-popup"
import { cn } from "@/lib/utils"

type CallbackPhase = "loading" | "success" | "error"

function normalizeProvider(raw: string | null): IntegrationProvider | null {
  if (!raw) return null
  if (raw === "quickbooks" || raw === "google_drive") return raw
  if (raw.toLowerCase().includes("quickbooks")) return "quickbooks"
  if (raw.toLowerCase().includes("google") || raw.toLowerCase().includes("drive")) {
    return "google_drive"
  }
  return null
}

export default function IntegrationsCallbackPage() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<CallbackPhase>("loading")
  const [closingPopup, setClosingPopup] = useState(false)

  const status = searchParams.get("status") === "success" ? "success" : "error"
  const provider = normalizeProvider(searchParams.get("provider"))
  const errorMessage = searchParams.get("message")
  const clientId = searchParams.get("clientId")

  const providerLabel = provider ? getIntegrationLabel(provider) : "Integration"
  const returnHref = clientId ? `/clients/${clientId}` : "/board"

  const popupPayload = useMemo<OAuthCallbackMessage>(
    () => ({
      type: "athena-oauth-complete",
      status,
      provider,
      message: errorMessage,
    }),
    [errorMessage, provider, status],
  )

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(popupPayload, window.location.origin)
      setClosingPopup(true)
      setPhase(status)
      window.setTimeout(() => window.close(), 700)
      return
    }

    setPhase(status)
  }, [popupPayload, status])

  if (phase === "loading") {
    return (
      <CallbackShell>
        <Spinner className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Finishing connection…</p>
      </CallbackShell>
    )
  }

  const isSuccess = phase === "success"

  return (
    <CallbackShell>
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full ring-1 ring-inset",
          isSuccess
            ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
            : "bg-red-50 text-red-600 ring-red-200",
        )}
      >
        {isSuccess ? (
          <RiCheckboxCircleLine className="size-7" />
        ) : (
          <RiCloseCircleLine className="size-7" />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-lg font-medium text-foreground">
          {isSuccess ? `${providerLabel} connected` : `${providerLabel} connection failed`}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {isSuccess
            ? closingPopup
              ? "Connected. This window will close automatically."
              : clientId
                ? "Your integration is ready. Return to the client to continue."
                : "Your integration is ready. You can return to Athena and continue working."
            : errorMessage ?? "Something went wrong while connecting. Try again from the client page."}
        </p>
      </div>

      {!closingPopup ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button asChild size="sm">
            <Link href={returnHref}>
              <RiArrowLeftLine className="size-3.5" data-icon="inline-start" />
              {clientId ? "Back to client" : "Back to board"}
            </Link>
          </Button>
          {!isSuccess && clientId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}`}>Try again</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Closing…</p>
      )}
    </CallbackShell>
  )
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      {children}
    </div>
  )
}
