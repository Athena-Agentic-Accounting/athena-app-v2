import type {
  OrgInviteRole,
  OrganizationInvitationSummary,
} from "@/lib/clerk/organization-invitations"

export type InviteMemberResponse = {
  invitation: OrganizationInvitationSummary
}

export type ListInvitationsResponse = {
  invitations: OrganizationInvitationSummary[]
}

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`
}

export async function inviteOrgMember(params: {
  email: string
  role: OrgInviteRole
}): Promise<InviteMemberResponse> {
  const res = await fetch("/api/organizations/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(await parseJsonError(res))
  }

  return (await res.json()) as InviteMemberResponse
}

export async function listOrgInvitations(): Promise<ListInvitationsResponse> {
  const res = await fetch("/api/organizations/invitations", {
    method: "GET",
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(await parseJsonError(res))
  }

  return (await res.json()) as ListInvitationsResponse
}

export async function revokeOrgInvitation(
  invitationId: string
): Promise<void> {
  const res = await fetch(
    `/api/organizations/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" }
  )

  if (!res.ok) {
    throw new Error(await parseJsonError(res))
  }
}
