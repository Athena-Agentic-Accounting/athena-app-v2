"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import type { OAuthCallbackMessage } from "@/lib/integrations/oauth-popup"

export default function IntegrationsCallbackPage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Finishing connection…")

  useEffect(() => {
    const status = searchParams.get("status") === "success" ? "success" : "error"
    const provider = searchParams.get("provider")
    const errorMessage = searchParams.get("message")

    const payload: OAuthCallbackMessage = {
      type: "athena-oauth-complete",
      status,
      provider,
      message: errorMessage,
    }

    if (window.opener) {
      window.opener.postMessage(payload, window.location.origin)
      setMessage(status === "success" ? "Connected. Closing…" : "Connection failed. Closing…")
      window.setTimeout(() => window.close(), 400)
      return
    }

    setMessage(
      status === "success"
        ? "Connected. You can close this tab and return to onboarding."
        : errorMessage ?? "Connection failed. Return to onboarding and try again.",
    )
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Spinner className="size-6" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
