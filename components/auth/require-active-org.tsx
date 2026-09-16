"use client"

import { useEffect, useRef } from "react"
import { useAuth, useClerk, useOrganizationList } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/**
 * Every engine `/api/*` route requires an active Clerk Organization (`org_id`
 * in the session token). Organizations are provisioned manually by the Athena
 * team on the Clerk dashboard — users just sign in — so Clerk never activates
 * an org on its own. This guard activates the user's (single) membership
 * before rendering anything that talks to the engine.
 */
export function RequireActiveOrg({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, orgId } = useAuth()
  const { isLoaded: orgsLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  })
  const { signOut } = useClerk()
  const activating = useRef(false)

  const memberships = userMemberships?.data ?? []
  const membershipsLoading = !orgsLoaded || userMemberships?.isLoading

  useEffect(() => {
    if (!authLoaded || orgId || membershipsLoading || activating.current) return
    const first = memberships[0]
    if (!first || !setActive) return

    activating.current = true
    void setActive({ organization: first.organization.id }).catch(() => {
      activating.current = false
    })
  }, [authLoaded, orgId, membershipsLoading, memberships, setActive])

  if (orgId) return <>{children}</>

  if (!authLoaded || membershipsLoading || memberships.length > 0) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border/70 bg-card p-6 text-center ring-1 ring-foreground/5">
        <h1 className="text-lg font-medium text-foreground">
          Workspace not provisioned
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your account isn&apos;t linked to a LUCA workspace yet. Workspaces are
          set up by the LUCA team — contact your LUCA representative to get
          your firm onboarded.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void signOut({ redirectUrl: "/auth" })}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
