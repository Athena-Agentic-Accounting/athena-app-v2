"use client"

import Image from "next/image"
import { RiCheckLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  getIntegrationDescription,
  getIntegrationLabel,
} from "@/lib/integrations/connect-integration"
import { cn } from "@/lib/utils"

const INTEGRATION_LOGOS: Partial<Record<IntegrationProvider, string>> = {
  quickbooks: "/integrations/qb.png",
}

type IntegrationConnectCardProps = {
  provider: IntegrationProvider
  connected: boolean
  connecting: boolean
  onConnect: () => void
  optional?: boolean
}

export function IntegrationConnectCard({
  provider,
  connected,
  connecting,
  onConnect,
  optional = false,
}: IntegrationConnectCardProps) {
  const logoSrc = INTEGRATION_LOGOS[provider]

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-card p-4",
        connected && "border-emerald-200 bg-emerald-50/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {logoSrc ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background p-1.5 ring-1 ring-inset ring-border/50">
            <Image
              src={logoSrc}
              alt=""
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-normal text-foreground">
              {getIntegrationLabel(provider)}
            </p>
            {optional ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                Optional
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {getIntegrationDescription(provider)}
          </p>
        </div>
      </div>

      {connected ? (
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-emerald-700">
          <RiCheckLine className="size-4" />
          Connected
        </div>
      ) : (
        <Button
          size="sm"
          className="shrink-0"
          disabled={connecting}
          onClick={onConnect}
        >
          {connecting ? (
            <>
              <Spinner data-icon="inline-start" />
              Connecting…
            </>
          ) : (
            "Connect"
          )}
        </Button>
      )}
    </div>
  )
}
