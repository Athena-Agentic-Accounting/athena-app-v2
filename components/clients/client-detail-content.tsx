"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  RiLinkM,
  RiLinkUnlinkM,
  RiUserAddLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  CLIENT_MEMBER_ROLE_LABELS,
  CLIENT_MEMBER_ROLES,
  fromApiMemberRole,
  inviteClientMember,
  removeClientMember,
  type ApiClientDetail,
  type ClientMemberRole,
} from "@/lib/api/clients"
import { disconnectIntegration } from "@/lib/api/connections"
import {
  getIntegrationHealthLabel,
  getIntegrationHealthVariant,
  getProviderDescription,
  getProviderDisplayName,
  normalizeIntegrationProvider,
} from "@/lib/clients/integration-display"
import { connectIntegration } from "@/lib/integrations/connect-integration"
import { cn } from "@/lib/utils"

type ClientDetailContentProps = {
  clientId: string
  detail: ApiClientDetail
  onUpdated?: () => void
}

export function ClientDetailContent({
  clientId,
  detail,
  onUpdated,
}: ClientDetailContentProps) {
  const { getToken } = useAuth()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<ClientMemberRole>("client_observer")
  const [inviting, setInviting] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProvider | null>(
    null,
  )
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<IntegrationProvider | null>(null)

  const connections = detail.connections ?? []
  const members = detail.members ?? []
  const activities = detail.activities ?? []

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()

    const email = inviteEmail.trim()
    if (!email) {
      toast.error("Enter an email address.")
      return
    }

    setInviting(true)
    try {
      const token = await getToken()
      await inviteClientMember(token, clientId, email, inviteRole)
      toast.success("Member invited", { description: email })
      setInviteEmail("")
      onUpdated?.()
    } catch (err) {
      toast.error("Could not invite member", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string, email: string) {
    if (!window.confirm(`Remove ${email} from this client?`)) return

    setRemovingMemberId(memberId)
    try {
      const token = await getToken()
      await removeClientMember(token, clientId, memberId)
      toast.success("Member removed")
      onUpdated?.()
    } catch (err) {
      toast.error("Could not remove member", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setRemovingMemberId(null)
    }
  }

  async function handleConnect(provider: IntegrationProvider) {
    setConnectingProvider(provider)
    try {
      const token = await getToken()
      await connectIntegration(provider, { token, clientId })
      toast.success(`${getProviderDisplayName(provider)} connected`)
      onUpdated?.()
    } catch (err) {
      toast.error("Connection failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setConnectingProvider(null)
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    setDisconnectingProvider(provider)
    try {
      const token = await getToken()
      await disconnectIntegration(token, provider, clientId)
      toast.success(`${getProviderDisplayName(provider)} disconnected`)
      onUpdated?.()
    } catch (err) {
      toast.error("Disconnect failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setDisconnectingProvider(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Activities" value={detail.activityCount ?? 0} />
        <StatCard label="Pending approvals" value={detail.pendingApprovals ?? 0} />
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 ring-1 ring-foreground/5">
          <p className="text-xs text-muted-foreground">Integration health</p>
          <Badge
            variant={getIntegrationHealthVariant(detail.integrationHealth)}
            className="mt-2"
          >
            {getIntegrationHealthLabel(detail.integrationHealth)}
          </Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Integrations</h2>

        {connections.length === 0 ? (
          <div className="space-y-2 rounded-xl border border-dashed border-border/70 p-3">
            <IntegrationRow
              label="QuickBooks Online"
              description="Connect books for this client."
              connected={false}
              loading={connectingProvider === "quickbooks"}
              onConnect={() => void handleConnect("quickbooks")}
            />
            <IntegrationRow
              label="Google Drive"
              description="Optional document storage for this client."
              connected={false}
              loading={connectingProvider === "google_drive"}
              onConnect={() => void handleConnect("google_drive")}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((connection) => {
              const provider = normalizeIntegrationProvider(connection.provider)
              return (
                <IntegrationRow
                  key={connection.provider}
                  label={getProviderDisplayName(connection.provider)}
                  description={getProviderDescription(connection.provider)}
                  connected={connection.connected}
                  loading={
                    provider !== null &&
                    (connectingProvider === provider || disconnectingProvider === provider)
                  }
                  onConnect={provider ? () => void handleConnect(provider) : undefined}
                  onDisconnect={
                    provider && connection.connected
                      ? () => void handleDisconnect(provider)
                      : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">Members</h2>
          <span className="text-xs text-muted-foreground">{members.length} total</span>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {CLIENT_MEMBER_ROLE_LABELS[fromApiMemberRole(member.role)] ??
                      member.role}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      disabled={removingMemberId === member.id}
                      onClick={() => void handleRemoveMember(member.id, member.email)}
                    >
                      {removingMemberId === member.id ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        "Remove"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <form
          onSubmit={(event) => void handleInvite(event)}
          className="rounded-xl border border-border/70 bg-muted/15 p-4"
        >
          <FieldGroup className="gap-3 sm:grid sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <Field>
              <FieldLabel htmlFor="invite-email">Invite by email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="colleague@firm.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as ClientMemberRole)
                }
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {CLIENT_MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {CLIENT_MEMBER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" size="sm" disabled={inviting} className="w-fit sm:mb-0.5">
              {inviting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Inviting…
                </>
              ) : (
                <>
                  <RiUserAddLine className="size-3.5" />
                  Send invite
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </section>

      {activities.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Recent activities</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 10).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.type ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.status ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      ) : null}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4 ring-1 ring-foreground/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function IntegrationRow({
  label,
  description,
  connected,
  loading = false,
  onConnect,
  onDisconnect,
}: {
  label: string
  description?: string
  connected: boolean
  loading?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/70 px-4 py-3 ring-1 ring-foreground/5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {connected && onDisconnect ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-7 gap-1 px-2 text-xs")}
            disabled={loading}
            onClick={onDisconnect}
          >
            {loading ? (
              <Spinner className="size-3.5" />
            ) : (
              <>
                <RiLinkUnlinkM className="size-3.5" />
                Disconnect
              </>
            )}
          </Button>
        ) : onConnect ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={loading}
            onClick={onConnect}
          >
            {loading ? (
              <Spinner className="size-3.5" />
            ) : (
              <>
                <RiLinkM className="size-3.5" />
                Connect
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
