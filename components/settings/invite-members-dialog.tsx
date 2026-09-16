"use client"

import { useEffect, useState } from "react"
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
import { useReload } from "@/hooks/use-reload"

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

  const [invitationsToken, reloadInvitations] = useReload()
  const [wasOpen, setWasOpen] = useState(false)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open && organization) setLoadingInvitations(true)
  }

  useEffect(() => {
    if (!open || !organization) return

    let cancelled = false
    void (async () => {
      try {
        const page = await organization.getInvitations({ status: ["pending"] })
        if (cancelled) return
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
        if (!cancelled) setLoadingInvitations(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, organization, invitationsToken])

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
      reloadInvitations()
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
      reloadInvitations()
    } catch (err) {
      toast.error("Could not revoke invitation", {
        description: inviteErrorMessage(err),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] w-[calc(100%-2rem)] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Invite teammates
          </DialogTitle>
          <DialogDescription className="max-w-sm text-pretty leading-relaxed">
            Invite people to your firm&apos;s workspace. They&apos;ll receive an email
            with a sign-in link.
          </DialogDescription>
        </DialogHeader>

        {!isLoaded ? (
          <div className="flex min-h-48 items-center justify-center px-5 pb-5">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-0 overflow-y-auto px-5 pb-5">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleInvite()
              }}
            >
              <Field>
                <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@firm.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  autoFocus
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
                type="submit"
                className="w-full"
                disabled={sending || !email.trim()}
              >
                {sending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Sending invitation…
                  </>
                ) : (
                  "Send invitation"
                )}
              </Button>
            </form>

            <div className="mt-5 border-t border-border/60 pt-4">
              <p className="mb-2.5 text-xs font-medium text-foreground">
                Pending invitations
              </p>
              {loadingInvitations ? (
                <div className="flex min-h-16 items-center justify-center">
                  <Spinner className="size-4 text-muted-foreground" />
                </div>
              ) : invitations.length === 0 ? (
                <p className="rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground">
                  No pending invitations.
                </p>
              ) : (
                <ul className="space-y-1.5" aria-label="Pending invitations">
                  {invitations.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {invitation.emailAddress}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline" className="font-normal">
                          {invitation.role.replace(/^org:/, "")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Revoke invitation to ${invitation.emailAddress}`}
                          onClick={() => void handleRevoke(invitation)}
                        >
                          <RiCloseLine className="size-4" />
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
