"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  RiArrowDownSLine,
  RiArrowUpDownLine,
  RiArrowUpSLine,
  RiDownloadLine,
  RiExpandDiagonalLine,
  RiFilter3Line,
  RiSearchLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { IntegrationHealthBadge } from "@/components/clients/integration-health-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
  countActiveFilters,
  DEFAULT_CLIENTS_TABLE_FILTERS,
  exportClientsCsv,
  filterClients,
  sortClients,
  type ActivityFilter,
  type ClientsSortDirection,
  type ClientsSortKey,
  type ClientsTableFilters,
  type IntegrationHealthFilter,
  type PendingFilter,
} from "@/lib/clients/clients-table-utils"
import { getInitials } from "@/lib/clients/map-api-client"
import { cn } from "@/lib/utils"

type ClientsDataTableProps = {
  clients: ApiClient[]
}

const INTEGRATION_HEALTH_OPTIONS: { value: IntegrationHealthFilter; label: string }[] =
  [
    { value: "all", label: "All integration health" },
    { value: "healthy", label: "Healthy" },
    { value: "attention", label: "Needs attention" },
    { value: "disconnected", label: "Disconnected" },
  ]

const PENDING_OPTIONS: { value: PendingFilter; label: string }[] = [
  { value: "all", label: "All pending" },
  { value: "has_pending", label: "Has pending approvals" },
  { value: "clear", label: "No pending approvals" },
]

const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All activity levels" },
  { value: "active", label: "Has activities" },
  { value: "idle", label: "No activities" },
  { value: "high", label: "High activity (5+)" },
]

export function ClientsDataTable({ clients }: ClientsDataTableProps) {
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useState<ClientsTableFilters>(DEFAULT_CLIENTS_TABLE_FILTERS)
  const [sortKey, setSortKey] = useState<ClientsSortKey>("name")
  const [sortDirection, setSortDirection] = useState<ClientsSortDirection>("asc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredClients = useMemo(() => filterClients(clients, filters), [clients, filters])
  const visibleClients = useMemo(
    () => sortClients(filteredClients, sortKey, sortDirection),
    [filteredClients, sortKey, sortDirection],
  )

  const activeFilterCount = countActiveFilters(filters)
  const allVisibleSelected =
    visibleClients.length > 0 && visibleClients.every((client) => selectedIds.has(client.id))
  const someVisibleSelected = visibleClients.some((client) => selectedIds.has(client.id))

  if (selectAllRef.current) {
    selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected
  }

  function updateFilters(patch: Partial<ClientsTableFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function toggleSort(nextKey: ClientsSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(nextKey)
    setSortDirection("asc")
  }

  function toggleRowSelection(clientId: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleClients.forEach((client) => next.delete(client.id))
      } else {
        visibleClients.forEach((client) => next.add(client.id))
      }
      return next
    })
  }

  function handleExport() {
    const exportRows =
      selectedIds.size > 0
        ? visibleClients.filter((client) => selectedIds.has(client.id))
        : visibleClients

    if (exportRows.length === 0) {
      toast.error("Nothing to export", {
        description: "Adjust filters or select clients to export.",
      })
      return
    }

    exportClientsCsv(exportRows)
    toast.success("Export started", {
      description: `${exportRows.length} client${exportRows.length === 1 ? "" : "s"} exported.`,
    })
  }

  function resetFilters() {
    setFilters(DEFAULT_CLIENTS_TABLE_FILTERS)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1 xl:max-w-sm">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search clients..."
              className="h-9 bg-background pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={filters.integrationHealth}
              options={INTEGRATION_HEALTH_OPTIONS}
              onChange={(value) =>
                updateFilters({ integrationHealth: value as IntegrationHealthFilter })
              }
            />
            <FilterSelect
              value={filters.pending}
              options={PENDING_OPTIONS}
              onChange={(value) => updateFilters({ pending: value as PendingFilter })}
            />
            <FilterSelect
              value={filters.activity}
              options={ACTIVITY_OPTIONS}
              onChange={(value) => updateFilters({ activity: value as ActivityFilter })}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg bg-background px-3 font-normal"
                >
                  <RiFilter3Line className="size-3.5" />
                  Filter
                  {activeFilterCount > 0 ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.pending === "has_pending"}
                  onCheckedChange={(checked) =>
                    updateFilters({ pending: checked ? "has_pending" : "all" })
                  }
                >
                  Has pending approvals
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.activity === "idle"}
                  onCheckedChange={(checked) =>
                    updateFilters({ activity: checked ? "idle" : "all" })
                  }
                >
                  No activities yet
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.integrationHealth === "disconnected"}
                  onCheckedChange={(checked) =>
                    updateFilters({
                      integrationHealth: checked ? "disconnected" : "all",
                    })
                  }
                >
                  Disconnected integrations
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={activeFilterCount === 0}
                  onCheckedChange={() => resetFilters()}
                >
                  Reset all filters
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg bg-background px-3 font-normal"
              onClick={handleExport}
            >
              <RiDownloadLine className="size-3.5" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {visibleClients.length} of {clients.length} clients
          </span>
          {selectedIds.size > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
              {selectedIds.size} selected
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs ring-1 ring-foreground/5">
        <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-4">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                aria-label="Select all visible clients"
                className="size-3.5 rounded border-border accent-primary"
              />
            </TableHead>
            <SortableHead
              label="Client"
              active={sortKey === "name"}
              direction={sortDirection}
              onClick={() => toggleSort("name")}
            />
            <SortableHead
              label="Integration health"
              active={sortKey === "integrationHealth"}
              direction={sortDirection}
              onClick={() => toggleSort("integrationHealth")}
            />
            <SortableHead
              label="Activities"
              active={sortKey === "activityCount"}
              direction={sortDirection}
              onClick={() => toggleSort("activityCount")}
              className="text-right"
            />
            <SortableHead
              label="Pending"
              active={sortKey === "pendingApprovals"}
              direction={sortDirection}
              onClick={() => toggleSort("pendingApprovals")}
              className="text-right"
            />
            <TableHead className="w-12 pr-4 text-right"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleClients.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                No clients match your filters.
              </TableCell>
            </TableRow>
          ) : (
            visibleClients.map((client) => {
              const selected = selectedIds.has(client.id)

              return (
                <TableRow
                  key={client.id}
                  data-state={selected ? "selected" : undefined}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <TableCell className="pl-4" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleRowSelection(client.id)}
                      aria-label={`Select ${client.name}`}
                      className="size-3.5 rounded border-border accent-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{client.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{client.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <IntegrationHealthBadge health={client.integrationHealth} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {client.activityCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {client.pendingApprovals ?? 0}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      aria-label={`Open ${client.name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        router.push(`/clients/${client.id}`)
                      }}
                    >
                      <RiExpandDiagonalLine className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-lg border border-border bg-background py-1 pr-8 pl-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <span className="sr-only">{selected?.label}</span>
    </div>
  )
}

function SortableHead({
  label,
  active,
  direction,
  onClick,
  className,
}: {
  label: string
  active: boolean
  direction: ClientsSortDirection
  onClick: () => void
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <RiArrowUpSLine className="size-3.5" />
          ) : (
            <RiArrowDownSLine className="size-3.5" />
          )
        ) : (
          <RiArrowUpDownLine className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  )
}
