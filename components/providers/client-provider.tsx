"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth, useUser } from "@clerk/nextjs"

import { listClients } from "@/lib/api/clients"
import { getAthenaMetadata } from "@/lib/athena/user-metadata"
import { mapApiClientToClient } from "@/lib/clients/map-api-client"
import {
  ALL_CLIENTS_ID,
  resolveTenantClients,
  type TenantClientConfig,
} from "@/lib/clients/resolve-clients"
import { getClientById, type Client } from "@/lib/clients/mock-clients"

type ClientContextValue = TenantClientConfig & {
  isLoaded: boolean
  isLoadingClients: boolean
  selectedClientId: string
  selectedClient: Client
  setSelectedClientId: (id: string) => void
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken } = useAuth()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [apiClients, setApiClients] = useState<Client[] | null>(null)
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  const meta = useMemo(
    () =>
      getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
    [user?.unsafeMetadata],
  )

  const fallbackConfig = useMemo(() => resolveTenantClients(meta), [meta])

  const refreshClients = useCallback(async () => {
    if (!meta?.onboardingComplete) return

    setIsLoadingClients(true)
    try {
      const token = await getToken()
      const clients = await listClients(token)
      setApiClients(clients.map(mapApiClientToClient))
    } catch {
      setApiClients(null)
    } finally {
      setIsLoadingClients(false)
    }
  }, [getToken, meta?.onboardingComplete])

  useEffect(() => {
    if (!userLoaded) return

    let cancelled = false

    async function load() {
      if (!meta?.onboardingComplete) return

      setIsLoadingClients(true)
      try {
        const token = await getToken()
        const clients = await listClients(token)
        if (cancelled) return
        setApiClients(clients.map(mapApiClientToClient))
      } catch {
        if (!cancelled) setApiClients(null)
      } finally {
        if (!cancelled) setIsLoadingClients(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [getToken, meta?.onboardingComplete, userLoaded])

  const tenantConfig = useMemo((): TenantClientConfig => {
    if (apiClients && apiClients.length > 0) {
      if (meta?.institution?.tenantType === "in_house") {
        const primaryId = meta.institution.primaryClientId
        const primary =
          apiClients.find((client) => client.id === primaryId) ?? apiClients[0]
        return {
          tenantType: "in_house",
          showClientSwitcher: false,
          clients: primary ? [primary] : apiClients,
          defaultClientId: primary?.id ?? apiClients[0].id,
          source: "api",
        }
      }

      return {
        tenantType: "accounting_firm",
        showClientSwitcher: true,
        clients: [
          { id: ALL_CLIENTS_ID, name: "All clients", initials: "All" },
          ...apiClients,
        ],
        defaultClientId: ALL_CLIENTS_ID,
        source: "api",
      }
    }

    return fallbackConfig
  }, [apiClients, fallbackConfig, meta?.institution?.primaryClientId, meta?.institution?.tenantType])

  // Once the user is loaded, a selection that isn't one of this tenant's clients
  // falls back to the default.
  const effectiveClientId =
    selectedClientId &&
    (!userLoaded || tenantConfig.clients.some((client) => client.id === selectedClientId))
      ? selectedClientId
      : tenantConfig.defaultClientId

  const selectedClient = useMemo(
    () =>
      tenantConfig.clients.find((client) => client.id === effectiveClientId) ??
      getClientById(tenantConfig.defaultClientId) ??
      tenantConfig.clients[0]!,
    [effectiveClientId, tenantConfig],
  )

  return (
    <ClientContext.Provider
      value={{
        ...tenantConfig,
        isLoaded: userLoaded,
        isLoadingClients,
        selectedClientId: effectiveClientId,
        selectedClient,
        setSelectedClientId,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error("useClient must be used within ClientProvider")
  }
  return context
}
