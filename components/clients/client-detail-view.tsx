"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiDownloadLine, RiGroupLine } from "@remixicon/react"
import { toast } from "sonner"

import { ClientDetailContent } from "@/components/clients/client-detail-content"
import { useClient } from "@/components/providers/client-provider"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { downloadClientAuditExport, getClient, type ApiClientDetail } from "@/lib/api/clients"

type ClientDetailViewProps = {
  clientId: string
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { getToken } = useAuth()
  const { refreshClients } = useClient()
  const [detail, setDetail] = useState<ApiClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportingAudit, setExportingAudit] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const data = await getClient(token, clientId)
      setDetail(data)
    } catch (err) {
      toast.error("Could not load client", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [clientId, getToken])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  async function handleAuditExport() {
    setExportingAudit(true)
    try {
      const token = await getToken()
      const { blob, filename } = await downloadClientAuditExport(token, clientId)
      triggerDownload(blob, filename)
      toast.success("Audit export downloaded")
    } catch (err) {
      toast.error("Could not export audit trail", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setExportingAudit(false)
    }
  }

  function handleUpdated() {
    void loadDetail()
    void refreshClients()
  }

  const clientName = detail?.name ?? "Client"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={clientName}
        description="Integrations, team access, and audit exports"
        icon={RiGroupLine}
        breadcrumbs={[
          { label: "Clients", href: "/clients" },
          { label: clientName },
        ]}
        showSearch={false}
        showNotifications={false}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-4 text-xs"
                disabled={exportingAudit || loading || !detail}
                onClick={() => void handleAuditExport()}
              >
                {exportingAudit ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <RiDownloadLine className="size-3.5" />
                )}
                Download audit export
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              JSON export of client-scoped audit events. Requires reviewer access or higher.
            </TooltipContent>
          </Tooltip>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : detail ? (
          <ClientDetailContent
            clientId={clientId}
            detail={detail}
            onUpdated={handleUpdated}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Client not found.</p>
        )}
      </div>
    </div>
  )
}
