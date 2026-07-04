"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useMemo } from "react"

import type { ApiClientDetail, ClientMemberRole } from "@/lib/api/clients"
import { fromApiMemberRole, getMemberEmail } from "@/lib/api/clients"

export function useWorkspacePermissions(clientDetail?: ApiClientDetail | null) {
  const { orgRole } = useAuth()
  const { user } = useUser()

  const isWorkspaceAdmin = orgRole === "org:admin"
  const canManageSkills = orgRole === "org:admin" || orgRole === "org:member"

  const currentClientRole = useMemo((): ClientMemberRole | null => {
    if (!clientDetail?.members?.length || !user?.primaryEmailAddress?.emailAddress) {
      return null
    }

    const email = user.primaryEmailAddress.emailAddress.toLowerCase()
    const member = clientDetail.members.find((entry) => getMemberEmail(entry) === email)

    return member ? fromApiMemberRole(member.role) : null
  }, [clientDetail?.members, user?.primaryEmailAddress?.emailAddress])

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
