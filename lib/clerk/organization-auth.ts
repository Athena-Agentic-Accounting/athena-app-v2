import { auth } from "@clerk/nextjs/server"

import type { OrgInviteRole } from "@/lib/clerk/organization-invitations"

export type OrgAdminContext = {
  userId: string
  orgId: string
  orgRole: string
}

export async function requireOrgAdmin(): Promise<
  | { ok: true; context: OrgAdminContext }
  | { ok: false; status: number; error: string }
> {
  const session = await auth()
  const userId = session.userId
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in to manage invitations." }
  }

  const orgId = session.orgId
  if (!orgId) {
    return {
      ok: false,
      status: 403,
      error: "Select or create a workspace organization before inviting teammates.",
    }
  }

  const orgRole = session.orgRole
  if (orgRole !== "org:admin") {
    return {
      ok: false,
      status: 403,
      error: "Only organization admins can send or manage invitations.",
    }
  }

  return {
    ok: true,
    context: { userId, orgId, orgRole: orgRole ?? "org:member" },
  }
}

export function parseInviteRole(raw: unknown): OrgInviteRole | null {
  if (raw === "org:admin" || raw === "org:member") return raw
  return null
}

export function invitationRedirectUrl(req: Request): string | undefined {
  const origin = req.headers.get("origin")
  const base =
    origin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  if (!base) return undefined
  return `${base.replace(/\/$/, "")}/auth`
}
