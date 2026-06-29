"use client"

import { useRouter } from "next/navigation"

import { ConnectionStatusBadge } from "@/components/clients/connection-status-badge"
import { useClient } from "@/components/providers/client-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ApiClient } from "@/lib/api/clients"
import {
  getActiveActivityCount,
  getClientDriveConnection,
  getClientQboConnection,
  getTeamCount,
} from "@/lib/clients/connection-status"

type ClientsDataTableProps = {
  clients: ApiClient[]
}

export function ClientsDataTable({ clients }: ClientsDataTableProps) {
  const router = useRouter()
  const { setSelectedClientId } = useClient()

  function openClient(clientId: string) {
    router.push(`/clients/${clientId}`)
  }

  function openBoardForClient(event: React.MouseEvent, clientId: string) {
    event.stopPropagation()
    setSelectedClientId(clientId)
    router.push("/board")
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs ring-1 ring-foreground/5">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>QBO</TableHead>
            <TableHead>Drive</TableHead>
            <TableHead className="text-right">Active Activities</TableHead>
            <TableHead className="text-right">Team</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const qbo = getClientQboConnection(client)
            const drive = getClientDriveConnection(client)
            const activeActivities = getActiveActivityCount(client)
            const teamCount = getTeamCount(client)

            return (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => openClient(client.id)}
              >
                <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                <TableCell>
                  <ConnectionStatusBadge status={qbo.status} />
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge status={drive.status} />
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    className="tabular-nums text-foreground underline-offset-2 hover:underline"
                    onClick={(event) => openBoardForClient(event, client.id)}
                  >
                    {activeActivities}
                  </button>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {teamCount}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
