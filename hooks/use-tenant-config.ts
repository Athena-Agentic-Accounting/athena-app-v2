"use client"

import { useMemo } from "react"
import { useUser } from "@clerk/nextjs"

import {
  getAthenaMetadata,
  isAccountingFirmTenant,
  isInHouseTenant,
  isQuickBooksConnected,
} from "@/lib/athena/user-metadata"
import {
  resolveTenantClients,
  type TenantClientConfig,
} from "@/lib/clients/resolve-clients"

export function useTenantConfig(): TenantClientConfig & {
  isLoaded: boolean
  isInHouse: boolean
  isAccountingFirm: boolean
  quickBooksConnected: boolean
  welcomeCheckCompleted: boolean
  onboardingJustCompleted: boolean
  organizationName?: string
  firstClientName?: string
} {
  const { user, isLoaded } = useUser()

  const meta = useMemo(
    () =>
      getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
    [user?.unsafeMetadata],
  )

  const tenantConfig = useMemo(() => resolveTenantClients(meta), [meta])

  return {
    ...tenantConfig,
    isLoaded,
    isInHouse: isInHouseTenant(meta),
    isAccountingFirm: isAccountingFirmTenant(meta),
    quickBooksConnected: isQuickBooksConnected(meta),
    welcomeCheckCompleted: meta?.institution?.welcomeCheckCompleted === true,
    onboardingJustCompleted: meta?.onboardingJustCompleted === true,
    organizationName: meta?.institution?.organizationName,
    firstClientName: meta?.institution?.firstClientName,
  }
}
