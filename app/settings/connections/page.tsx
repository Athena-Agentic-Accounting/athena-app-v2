import { Suspense } from "react"

import IntegrationsCallbackPage from "@/app/integrations/callback/page-client"

export default function SettingsConnectionsCallbackRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Finishing connection…</p>
        </div>
      }
    >
      <IntegrationsCallbackPage />
    </Suspense>
  )
}
