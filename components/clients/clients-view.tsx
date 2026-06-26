"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiGroupLine } from "@remixicon/react"
import { toast } from "sonner"

import { ClientsDataTable } from "@/components/clients/clients-data-table"
import { CreateClientDialog } from "@/components/clients/create-client-dialog"
import { useClient } from "@/components/providers/client-provider"
import { PageHeader } from "@/components/shell/page-header"
import { Spinner } from "@/components/ui/spinner"
import { listClients, type ApiClient } from "@/lib/api/clients"

export function ClientsView() {
  const { getToken } = useAuth()
  const { refreshClients } = useClient()
  const [clients, setClients] = useState<ApiClient[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const data = await listClients(token)
      setClients(data)
    } catch (err) {
      toast.error("Could not load clients", {
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

  function handleClientCreated() {
    void loadClients()
    void refreshClients()
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Clients"
        description="Integration health, activity counts, and team access"
        icon={RiGroupLine}
        actionLabel="Add client"
        onAction={() => setCreateOpen(true)}
        showSearch={false}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-inset ring-border/50">
              <RiGroupLine className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first client to connect integrations and invite your team.
              </p>
            </div>
          </div>
        ) : (
          <ClientsDataTable clients={clients} />
        )}
      </div>

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleClientCreated}
      />
    </div>
  )
}
