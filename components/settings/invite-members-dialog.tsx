"use client"

import { useCallback, useEffect, useState } from "react"
import { useOrganization } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { RiCloseLine } from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"

// Must match the roles configured on the Clerk instance (topical-teal-15).
// "org:admin" / "org:member" ship with every instance; add custom roles
// (org:accountant, org:reviewer, …) here once they exist on the dashboard.
const INVITE_ROLES: { value: string; label: string; description: string }[] = [
  { value: "org:member", label: "Member", description: "Can use the workspace" },
  { value: "org:admin", label: "Admin", description: "Can invite and manage members" },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function inviteErrorMessage(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors[0]
    const code = first?.code ?? ""
    if (code === "duplicate_record" || code === "form_identifier_exists") {
      return "This person already has a pending invitation or is already a member."
    }
    if (code === "not_allowed_access" || code === "authorization_invalid") {
      return "You do not have permission to invite members."
    }
    if (first?.longMessage ?? first?.message) {
      return first.longMessage ?? first.message
    }
  }
  if (err instanceof Error && err.message) return err.message
  return "Could not send the invitation."
}

type PendingInvitation = {
  id: string
  emailAddress: string
  role: string
  revoke: () => Promise<unknown>
}

type InviteMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMembersDialog({ open, onOpenChange }: InviteMembersDialogProps) {
  const { organization, isLoaded } = useOrganization()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState(INVITE_ROLES[0].value)
  const [sending, setSending] = useState(false)
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  const loadInvitations = useCallback(async () => {
    if (!organization) return
    setLoadingInvitations(true)
    try {
      const page = await organization.getInvitations({ status: ["pending"] })
      setInvitations(
        page.data.map((invitation) => ({
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          role: String(invitation.role),
          revoke: () => invitation.revoke(),
        })),
      )
    } catch {
      // Non-fatal: the invite form still works without the pending list.
    } finally {
      setLoadingInvitations(false)
    }
  }, [organization])

  useEffect(() => {
    if (open) void loadInvitations()
  }, [open, loadInvitations])

  async function handleInvite() {
    if (!organization) return
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      toast.error("Enter a valid email address.")
      return
    }

    setSending(true)
    try {
      await organization.inviteMember({ emailAddress: trimmed, role })
      toast.success(`Invitation sent to ${trimmed}`)
      setEmail("")
      void loadInvitations()
    } catch (err) {
      toast.error("Could not invite member", { description: inviteErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  async function handleRevoke(invitation: PendingInvitation) {
    try {
      await invitation.revoke()
      toast.success(`Invitation to ${invitation.emailAddress} revoked`)
      void loadInvitations()
    } catch (err) {
      toast.error("Could not revoke invitation", {
        description: inviteErrorMessage(err),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite teammates</DialogTitle>
          <DialogDescription>
            Invite people to your firm&apos;s workspace. They&apos;ll receive an email
            with a sign-in link.
          </DialogDescription>
        </DialogHeader>

        {!isLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <Field>
                <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@firm.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleInvite()
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <NativeSelect
                  id="invite-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {INVITE_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Button
                className="w-full"
                disabled={sending || !email.trim()}
                onClick={() => void handleInvite()}
              >
                {sending ? <Spinner className="size-3.5" /> : "Send invitation"}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Pending invitations
              </p>
              {loadingInvitations ? (
                <div className="flex justify-center py-3">
                  <Spinner className="size-4 text-muted-foreground" />
                </div>
              ) : invitations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pending invitations.</p>
              ) : (
                <ul className="space-y-1.5">
                  {invitations.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-xs text-foreground">
                        {invitation.emailAddress}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline" className="font-normal">
                          {invitation.role.replace(/^org:/, "")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6 text-muted-foreground"
                          aria-label={`Revoke invitation to ${invitation.emailAddress}`}
                          onClick={() => void handleRevoke(invitation)}
                        >
                          <RiCloseLine className="size-3.5" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
