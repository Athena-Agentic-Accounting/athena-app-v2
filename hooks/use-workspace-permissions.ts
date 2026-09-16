"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useMemo } from "react"

import type { ApiClientDetail, ClientMemberRole } from "@/lib/api/clients"
import { fromApiMemberRole, getMemberEmail } from "@/lib/api/clients"

export function useWorkspacePermissions(clientDetail?: ApiClientDetail | null) {
  const { orgRole } = useAuth()
  const { user } = useUser()

  const isWorkspaceAdmin = orgRole === "org:admin"
  // Only roles the engine's ROLE_MAPPING actually grants skill writes to.
  // "org:member" is unmapped there, so granting it here just produced a full
  // authoring UI where every save 403s.
  const canManageSkills = orgRole === "org:admin" || orgRole === "org:accountant"

  const members = clientDetail?.members
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const currentClientRole = useMemo((): ClientMemberRole | null => {
    if (!members?.length || !userEmail) return null

    const email = userEmail.toLowerCase()
    const member = members.find((entry) => getMemberEmail(entry) === email)

    return member ? fromApiMemberRole(member.role) : null
  }, [members, userEmail])

  const canAddClient = isWorkspaceAdmin

  const canManageClientTeam =
    isWorkspaceAdmin || currentClientRole === "client_manager"

  const isClientTeamReadOnly = !canManageClientTeam

  return {
    isWorkspaceAdmin,
    currentClientRole,
    canAddClient,
    canManageClientTeam,
    isClientTeamReadOnly,
    canManageSkills,
  }
}
