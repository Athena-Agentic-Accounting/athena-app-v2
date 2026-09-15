"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { RiArrowRightSLine, RiPlugLine, RiRefreshLine } from "@remixicon/react"
import { toast } from "sonner"

import { ConnectionStatusBadge } from "@/components/clients/connection-status-badge"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { listClients, type ApiClient } from "@/lib/api/clients"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  getClientDriveConnection,
  getClientQboConnection,
  type ClientConnection,
} from "@/lib/clients/connection-status"
import { formatTimeAgo } from "@/lib/format/time-ago"
import {
  connectIntegration,
  getIntegrationDescription,
  getIntegrationLabel,
} from "@/lib/integrations/connect-integration"
import { cn } from "@/lib/utils"

const INTEGRATIONS: Array<{
  provider: IntegrationProvider
  logoSrc?: string
  logoFallback: string
  logoClassName: string
}> = [
  {
    provider: "quickbooks",
    logoSrc: "/integrations/qb.png",
    logoFallback: "QB",
    logoClassName: "bg-[#2CA01C]/10 text-[#2CA01C]",
  },
  {
    provider: "google_drive",
    logoFallback: "GD",
    logoClassName: "bg-blue-50 text-blue-600",
  },
]

function getConnection(client: ApiClient, provider: IntegrationProvider): ClientConnection {
  return provider === "quickbooks"
    ? getClientQboConnection(client)
    : getClientDriveConnection(client)
}

function getConnectionDetail(connection: ClientConnection): string | null {
  if (connection.status === "not_connected") return null

  const parts: string[] = []
  if (connection.accountEmail) parts.push(connection.accountEmail)
  else if (connection.companyId) parts.push(`Company ${connection.companyId}`)

  if (connection.lastSyncAt) parts.push(`Synced ${formatTimeAgo(connection.lastSyncAt)}`)
  else if (connection.connectedAt) {
    parts.push(`Connected ${formatTimeAgo(connection.connectedAt)}`)
  }

  return parts.length ? parts.join(" · ") : null
}

export function ConnectionsView() {
  const { getToken } = useAuth()
  const [clients, setClients] = useState<ApiClient[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    try {
      const token = await getToken()
      setClients(await listClients(token))
    } catch (err) {
      toast.error("Could not load connections", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadClients()
  }, [loadClients])

  const handleConnect = useCallback(
    async (client: ApiClient, provider: IntegrationProvider) => {
      setPending(`${client.id}:${provider}`)
      try {
        const token = await getToken()
        await connectIntegration(provider, { token, clientId: client.id })
        toast.success(`${getIntegrationLabel(provider)} connected`, {
          description: client.name,
        })
        await loadClients()
      } catch (err) {
        toast.error(`${getIntegrationLabel(provider)} connection failed`, {
          description: err instanceof Error ? err.message : "Something went wrong.",
        })
      } finally {
        setPending(null)
      }
    },
    [getToken, loadClients],
  )

  const connectedCount = useMemo(
    () =>
      clients.reduce(
        (total, client) =>
          total +
          INTEGRATIONS.filter(
            (app) => getConnection(client, app.provider).status !== "not_connected",
          ).length,
        0,
      ),
    [clients],
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Connections"
        description={
          loading
            ? undefined
            : `${connectedCount} of ${clients.length * INTEGRATIONS.length} connected`
        }
        icon={RiPlugLine}
        showSearch={false}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadClients()}
          >
            <RiRefreshLine className="size-3.5" data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-inset ring-border/50">
              <RiPlugLine className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Add a client before connecting QuickBooks or Google Drive.
            </p>
            <Button asChild size="sm">
              <Link href="/clients">Go to clients</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {clients.map((client) => (
              <section key={client.id} className="rounded-xl border border-border/60 bg-card">
                <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                  <h2 className="truncate text-sm font-medium text-foreground">
                    {client.name}
                  </h2>
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Open client
                    <RiArrowRightSLine className="size-3.5" />
                  </Link>
                </header>

                <ul>
                  {INTEGRATIONS.map((app) => {
                    const connection = getConnection(client, app.provider)
                    const detail = getConnectionDetail(connection)
                    const isPending = pending === `${client.id}:${app.provider}`
                    const isConnected = connection.status !== "not_connected"

                    return (
                      <li
                        key={app.provider}
                        className="flex items-center gap-3 border-b border-border/40 px-4 py-3 last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-medium",
                            app.logoClassName,
                          )}
                        >
                          {app.logoSrc ? (
                            <Image
                              src={app.logoSrc}
                              alt=""
                              width={36}
                              height={36}
                              className="size-9 object-contain"
                            />
                          ) : (
                            app.logoFallback
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">
                            {getIntegrationLabel(app.provider)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {detail ?? getIntegrationDescription(app.provider)}
                          </p>
                        </div>

                        <ConnectionStatusBadge
                          status={connection.status}
                          className="hidden shrink-0 sm:inline-flex"
                        />

                        <Button
                          variant={isConnected ? "outline" : "default"}
                          size="sm"
                          className="shrink-0"
                          disabled={isPending}
                          onClick={() => void handleConnect(client, app.provider)}
                        >
                          {isPending ? (
                            <Spinner className="size-3.5" data-icon="inline-start" />
                          ) : null}
                          {isConnected ? "Reconnect" : "Connect"}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
