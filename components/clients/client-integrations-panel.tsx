"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
  RiFilter3Line,
  RiFolderLine,
  RiSearchLine,
  RiSettings3Line,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import type { ApiClientDetail } from "@/lib/api/clients"
import { setGoogleDriveFolder } from "@/lib/api/connections"
import {
  CONNECTION_STATUS_LABELS,
  getClientDriveConnection,
  getClientQboConnection,
  type ClientConnection,
  type ConnectionStatus,
} from "@/lib/clients/connection-status"
import { formatDateTime, formatTimeAgo } from "@/lib/format/time-ago"
import {
  getIntegrationDescription,
  getIntegrationLabel,
} from "@/lib/integrations/connect-integration"
import { cn } from "@/lib/utils"

type IntegrationTab = "all" | "connected" | "disconnected"

type ClientIntegrationsPanelProps = {
  detail: ApiClientDetail
  connectingProvider: IntegrationProvider | null
  onConnect: (provider: IntegrationProvider) => void
}

type IntegrationApp = {
  provider: IntegrationProvider
  label: string
  description: string
  connection: ClientConnection
}

const INTEGRATION_APPS: Array<{
  provider: IntegrationProvider
  logoSrc?: string
  logoClassName?: string
  logoFallback: string
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

const TAB_OPTIONS: { id: IntegrationTab; label: string }[] = [
  { id: "all", label: "All Apps" },
  { id: "connected", label: "Connected" },
  { id: "disconnected", label: "Disconnected" },
]

function isConnectedStatus(status: ConnectionStatus): boolean {
  return status === "connected" || status === "reauth_needed"
}

function getStatusBadge(status: ConnectionStatus): { label: string; className: string } {
  switch (status) {
    case "connected":
      return {
        label: "CONNECTED",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      }
    case "reauth_needed":
      return {
        label: "REAUTH NEEDED",
        className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      }
    default:
      return {
        label: "DISCONNECTED",
        className: "bg-muted text-muted-foreground",
      }
  }
}

export function ClientIntegrationsPanel({
  detail,
  connectingProvider,
  onConnect,
}: ClientIntegrationsPanelProps) {
  const [activeTab, setActiveTab] = useState<IntegrationTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [managingProvider, setManagingProvider] = useState<IntegrationProvider | null>(null)

  const apps = useMemo<IntegrationApp[]>(
    () =>
      INTEGRATION_APPS.map((app) => ({
        provider: app.provider,
        label: getIntegrationLabel(app.provider),
        description: getIntegrationDescription(app.provider),
        connection:
          app.provider === "quickbooks"
            ? getClientQboConnection(detail)
            : getClientDriveConnection(detail),
      })),
    [detail],
  )

  const visibleApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return apps.filter((app) => {
      if (activeTab === "connected" && !isConnectedStatus(app.connection.status)) return false
      if (activeTab === "disconnected" && app.connection.status !== "not_connected") return false

      if (!query) return true
      return (
        app.label.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      )
    })
  }, [activeTab, apps, searchQuery])

  const tabTitle =
    activeTab === "all"
      ? "All Apps"
      : activeTab === "connected"
        ? "Connected Apps"
        : "Disconnected Apps"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:max-w-sm sm:flex-1 sm:justify-end">
          <div className="relative min-w-0 flex-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search apps..."
              className="h-9 bg-background pl-9 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 bg-background px-3 text-xs font-normal"
          >
            <RiFilter3Line className="size-3.5" />
            Filter
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">{tabTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Integrated tools connected to this client&apos;s books and documents.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5">
        {visibleApps.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No apps match your search.
          </div>
        ) : (
          visibleApps.map((app, index) => {
            const meta = INTEGRATION_APPS.find((item) => item.provider === app.provider)!
            const statusBadge = getStatusBadge(app.connection.status)
            const isManaging = managingProvider === app.provider
            const isNotConnected = app.connection.status === "not_connected"

            return (
              <div key={app.provider}>
                {index > 0 ? <div className="border-t border-border/60" /> : null}

                <div className="flex items-start gap-3 px-4 py-4">
                  <IntegrationLogo meta={meta} label={app.label} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{app.label}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                          statusBadge.className,
                        )}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {app.description}
                    </p>
                    {app.connection.accountEmail ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground/80">
                        {app.connection.accountEmail}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1.5 bg-background px-3 text-xs font-normal"
                    onClick={() =>
                      setManagingProvider(isManaging ? null : app.provider)
                    }
                  >
                    <RiSettings3Line className="size-3.5" />
                    Manage
                  </Button>
                </div>

                {isManaging ? (
                  <div className="border-t border-border/60 bg-muted/15 px-4 py-4">
                    <IntegrationManagePanel
                      provider={app.provider}
                      clientId={detail.id}
                      boundFolderId={
                        app.provider === "google_drive"
                          ? getDriveFolderId(detail)
                          : undefined
                      }
                      connection={app.connection}
                      connecting={connectingProvider === app.provider}
                      isNotConnected={isNotConnected}
                      onConnect={() => onConnect(app.provider)}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function IntegrationLogo({
  meta,
  label,
}: {
  meta: (typeof INTEGRATION_APPS)[number]
  label: string
}) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-border/50",
        meta.logoClassName ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta.logoSrc ? (
        <Image
          src={meta.logoSrc}
          alt=""
          width={24}
          height={24}
          className="size-6 object-contain"
        />
      ) : (
        <span className="text-[11px] font-semibold">{meta.logoFallback}</span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}

/** Bound Drive folder from the detail payload's connectors (config.folderId). */
function getDriveFolderId(detail: ApiClientDetail): string | undefined {
  const connector = detail.connectors?.find(
    (c) => c.provider?.toUpperCase() === "GOOGLE_DRIVE",
  )
  return connector?.config?.folderId ?? undefined
}

function IntegrationManagePanel({
  provider,
  clientId,
  boundFolderId,
  connection,
  connecting,
  isNotConnected,
  onConnect,
}: {
  provider: IntegrationProvider
  clientId: string
  boundFolderId?: string
  connection: ClientConnection
  connecting: boolean
  isNotConnected: boolean
  onConnect: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Connection details
        </p>
        <span className="text-xs text-muted-foreground">
          {CONNECTION_STATUS_LABELS[connection.status]}
        </span>
      </div>

      <dl className="grid gap-2 text-xs">
        <DetailRow label="Account" value={connection.accountEmail ?? "—"} />
        <DetailRow label="Company ID" value={connection.companyId ?? "—"} />
        <DetailRow
          label="Connected"
          value={connection.connectedAt ? formatTimeAgo(connection.connectedAt) : "—"}
        />
        <DetailRow
          label="Last sync"
          value={connection.lastSyncAt ? formatTimeAgo(connection.lastSyncAt) : "—"}
        />
        {connection.tokenExpiresAt ? (
          <DetailRow
            label="Token expires"
            value={formatDateTime(connection.tokenExpiresAt)}
          />
        ) : null}
      </dl>

      {provider === "google_drive" && !isNotConnected ? (
        <DriveFolderBinding clientId={clientId} boundFolderId={boundFolderId} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={connecting}
          onClick={onConnect}
        >
          {connecting ? (
            <Spinner className="size-3.5" />
          ) : isNotConnected ? (
            "Connect"
          ) : (
            "Reconnect"
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Google Drive folder binding (added 2026-07-03). Until a folder is bound the
 * engine never indexes this client's Drive ("no folder bound"), so document
 * search stays empty. Accepts a folder ID or a full Drive folder URL.
 */
function DriveFolderBinding({
  clientId,
  boundFolderId,
}: {
  clientId: string
  boundFolderId?: string
}) {
  const { getToken } = useAuth()
  const [folderInput, setFolderInput] = useState("")
  const [savedFolderId, setSavedFolderId] = useState(boundFolderId)
  const [isSaving, setIsSaving] = useState(false)

  const parseFolderId = (value: string): string => {
    const trimmed = value.trim()
    // Accept a pasted Drive URL: .../folders/<id>?...
    const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/)
    return match?.[1] ?? trimmed
  }

  const handleSave = async () => {
    const folderId = parseFolderId(folderInput)
    if (!folderId) return

    setIsSaving(true)
    try {
      const token = await getToken()
      await setGoogleDriveFolder(token, clientId, folderId)
      setSavedFolderId(folderId)
      setFolderInput("")
      toast.success("Drive folder bound — initial indexing started")
    } catch (err) {
      toast.error("Could not bind Drive folder", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
      <div className="flex items-center gap-1.5">
        <RiFolderLine className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Drive folder
        </p>
      </div>

      {savedFolderId ? (
        <p className="text-xs text-muted-foreground">
          Bound to folder{" "}
          <span className="font-mono text-foreground">{savedFolderId}</span>
        </p>
      ) : (
        <p className="text-xs text-amber-700">
          No folder bound yet — Athena cannot index or search this client&apos;s
          documents until one is set.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={folderInput}
          onChange={(event) => setFolderInput(event.target.value)}
          placeholder="Paste a Drive folder URL or ID…"
          className="h-8 bg-background text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 px-3 text-xs"
          disabled={isSaving || !folderInput.trim()}
          onClick={() => void handleSave()}
        >
          {isSaving ? <Spinner className="size-3.5" /> : savedFolderId ? "Rebind" : "Bind"}
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  )
}
