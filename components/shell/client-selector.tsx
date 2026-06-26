"use client"

import {
  RiBuildingLine,
  RiCheckLine,
  RiExpandUpDownLine,
} from "@remixicon/react"

import { useClient } from "@/components/providers/client-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import type { Client } from "@/lib/clients/mock-clients"
import { cn } from "@/lib/utils"

function ClientBuildingIcon({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-inset ring-border/60",
        className,
      )}
    >
      <RiBuildingLine className={cn("size-4 text-muted-foreground", iconClassName)} />
    </div>
  )
}

type ClientMenuItemProps = {
  client: Client
  selected: boolean
  onSelect: (id: string) => void
}

function ClientMenuItem({ client, selected, onSelect }: ClientMenuItemProps) {
  return (
    <DropdownMenuItem
      className="cursor-pointer rounded-lg p-2 focus:bg-muted/70"
      onClick={() => onSelect(client.id)}
    >
      <div className="flex w-full items-center gap-3">
        <ClientBuildingIcon />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span className="truncate text-xs text-foreground">{client.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {client.id === "all" ? "Workspace view" : "Client"}
          </span>
        </div>
        {selected ? (
          <RiCheckLine className="size-4 shrink-0 text-muted-foreground" />
        ) : null}
      </div>
    </DropdownMenuItem>
  )
}

export function ClientSelector() {
  const {
    clients,
    selectedClient,
    selectedClientId,
    setSelectedClientId,
    showClientSwitcher,
    isLoaded,
  } = useClient()

  if (!isLoaded || !showClientSwitcher) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent"
            >
              <ClientBuildingIcon />
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <span className="truncate text-xs font-normal text-foreground">
                  {selectedClient.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {selectedClientId === "all" ? "Workspace view" : "Client"}
                </span>
              </div>
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background shadow-xs">
                <RiExpandUpDownLine className="size-3.5 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={20}
            className="w-[280px] min-w-[280px] rounded-2xl border border-border/60 p-2 shadow-md"
          >
            {clients.map((client) => (
              <ClientMenuItem
                key={client.id}
                client={client}
                selected={client.id === selectedClientId}
                onSelect={setSelectedClientId}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
