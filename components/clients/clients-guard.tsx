"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { useTenantConfig } from "@/hooks/use-tenant-config"

type ClientsGuardProps = {
  children: React.ReactNode
  redirectTo?: string
}

export function ClientsGuard({ children, redirectTo = "/board" }: ClientsGuardProps) {
  const router = useRouter()
  const { isLoaded, isInHouse } = useTenantConfig()

  useEffect(() => {
    if (isLoaded && isInHouse) {
      router.replace(redirectTo)
    }
  }, [isInHouse, isLoaded, redirectTo, router])

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  if (isInHouse) return null

  return children
}
