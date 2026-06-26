import { isClerkAPIResponseError } from "@clerk/nextjs/errors"

export type OrgInviteRole = "org:admin" | "org:member"

export const ORG_INVITE_ROLES: { value: OrgInviteRole; label: string; description: string }[] = [
  { value: "org:member", label: "Member", description: "Can use the workspace" },
  { value: "org:admin", label: "Admin", description: "Can invite and manage members" },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidInviteEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email))
}

export type OrganizationInvitationSummary = {
  id: string
  emailAddress: string
  role: string
  status: string
  createdAt: number
}

export function mapClerkInviteError(err: unknown): { message: string; status: number } {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors[0]
    const code = first?.code ?? ""
    const longMessage = first?.longMessage ?? first?.message

    if (code === "duplicate_record" || code === "form_identifier_exists") {
      return {
        message: "This person already has a pending invitation or is already a member.",
        status: 409,
      }
    }
    if (code === "not_allowed_access" || code === "authorization_invalid") {
      return { message: "You do not have permission to invite members.", status: 403 }
    }
    if (longMessage) {
      return { message: longMessage, status: err.status ?? 400 }
    }
  }

  if (err instanceof Error && err.message) {
    return { message: err.message, status: 500 }
  }

  return { message: "Could not process the invitation.", status: 500 }
}
