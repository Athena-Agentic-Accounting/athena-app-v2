"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  RiArrowRightLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiSearchLine,
  RiUserAddLine,
} from "@remixicon/react"
import { toast } from "sonner"

import {
  ClientIntegrationsPanel,
  DriveFolderBinding,
} from "@/components/clients/client-integrations-panel"
import { useClient } from "@/components/providers/client-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { IntegrationProvider } from "@/lib/athena/user-metadata"
import {
  CLIENT_MEMBER_ROLE_LABELS,
  CLIENT_MEMBER_ROLES,
  fromApiMemberRole,
  getMemberEmail,
  inviteClientMember,
  removeClientMember,
  type ApiClientDetail,
  type ClientMemberRole,
} from "@/lib/api/clients"
import { getDriveIndexStatus, searchDriveDocuments, type DriveSearchResult } from "@/lib/api/drive"
import {
  getClientDriveConnection,
} from "@/lib/clients/connection-status"
import { formatTimeAgo } from "@/lib/format/time-ago"
import { trackRecent } from "@/lib/navigation/recents"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { connectIntegration } from "@/lib/integrations/connect-integration"
import { cn } from "@/lib/utils"

type ClientDetailContentProps = {
  clientId: string
  detail: ApiClientDetail
  onUpdated?: () => void
}

function getMemberDisplayName(email: string | undefined, name?: string): string {
  if (name?.trim()) return name.trim()
  if (!email?.trim()) return "Team member"

  const local = email.split("@")[0] ?? email
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0).toUpperCase()}${parts[0]!.slice(1)} ${parts[1]!.charAt(0).toUpperCase()}.`
  }
  return local
}

function formatActivitySummary(
  name: string,
  status?: string,
  updatedAt?: string,
): string {
  const statusLabel = formatActivityStatus(status)
  const timeLabel = updatedAt ? formatTimeAgo(updatedAt) : null

  if (statusLabel && timeLabel) {
    return `${name} — ${statusLabel} ${timeLabel}`
  }
  if (statusLabel) return `${name} — ${statusLabel}`
  return name
}

function formatActivityStatus(status?: string): string | null {
  if (!status) return null

  const value = status.toLowerCase()
  if (value === "completed" || value === "complete") return "completed"
  if (value === "in_progress" || value === "in-progress") return "in progress"
  if (value === "to_do" || value === "to-do") return "to do"
  return status.replace(/_/g, " ")
}

export function ClientDetailContent({
  clientId,
  detail,
  onUpdated,
}: ClientDetailContentProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { setSelectedClientId } = useClient()
  const { canManageClientTeam } = useWorkspacePermissions(detail)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<ClientMemberRole>("client_observer")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProvider | null>(null)

  const [driveIndexCount, setDriveIndexCount] = useState<number | null>(null)
  const [driveLastSynced, setDriveLastSynced] = useState<string | null>(null)
  const [driveNeedsSetup, setDriveNeedsSetup] = useState(false)
  const [driveFolderId, setDriveFolderId] = useState<string | undefined>(undefined)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveSearchQuery, setDriveSearchQuery] = useState("")
  const [driveSearchResults, setDriveSearchResults] = useState<DriveSearchResult[]>([])
  const [driveSearching, setDriveSearching] = useState(false)

  const members = detail.members ?? []
  const activities = (detail.activities ?? []).slice(0, 5)
  const drive = getClientDriveConnection(detail)

  useEffect(() => {
    if (!detail.name) return
    trackRecent({
      id: clientId,
      label: detail.name,
      href: `/clients/${clientId}`,
      kind: "client",
    })
  }, [clientId, detail.name])

  const loadDriveIndex = useCallback(async () => {
    if (drive.status === "not_connected") {
      setDriveIndexCount(null)
      setDriveLastSynced(null)
      return
    }

    try {
      const token = await getToken()
      const index = await getDriveIndexStatus(token, clientId)
      if (!index) return

      setDriveIndexCount(index.documentCount ?? null)
      setDriveLastSynced(index.lastSyncedAt ?? index.last_synced_at ?? null)
      setDriveNeedsSetup(index.needsSetup ?? !index.folderId)
      setDriveFolderId(index.folderId ?? undefined)
      setDriveError(index.lastError ?? null)
    } catch (err) {
      toast.error("Could not load the Drive index status", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    }
  }, [clientId, drive.status, getToken])

  useEffect(() => {
    void loadDriveIndex()
  }, [loadDriveIndex])

  useEffect(() => {
    if (!driveSearchQuery.trim()) {
      setDriveSearchResults([])
      return
    }

    const handle = window.setTimeout(async () => {
      setDriveSearching(true)
      try {
        const token = await getToken()
        const results = await searchDriveDocuments(token, clientId, driveSearchQuery)
        setDriveSearchResults(results)
      } catch (err) {
        setDriveSearchResults([])
        toast.error("Drive search failed", {
          description: err instanceof Error ? err.message : "Something went wrong.",
        })
      } finally {
        setDriveSearching(false)
      }
    }, 300)

    return () => window.clearTimeout(handle)
  }, [clientId, driveSearchQuery, getToken])

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
      toast.success("Team member invited", { description: email })
      setInviteEmail("")
      setShowInviteForm(false)
      onUpdated?.()
    } catch (err) {
      toast.error("Could not invite member", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingMemberId(memberId)
    try {
      const token = await getToken()
      await removeClientMember(token, clientId, memberId)
      toast.success("Member removed")
      setConfirmRemoveId(null)
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
      toast.success("Connected")
      onUpdated?.()
    } catch (err) {
      toast.error("Connection failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setConnectingProvider(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Panel title="Integrations">
        <ClientIntegrationsPanel
          detail={detail}
          connectingProvider={connectingProvider}
          onConnect={(provider) => void handleConnect(provider)}
        />
      </Panel>

      <Separator />

      <Panel title="Team">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => {
                const role = fromApiMemberRole(member.role)
                const displayName = getMemberDisplayName(
                  getMemberEmail(member) ?? undefined,
                  member.name,
                )
                const isConfirming = confirmRemoveId === member.id

                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{displayName}</p>
                      <Badge variant="outline" className="mt-1 font-normal">
                        {CLIENT_MEMBER_ROLE_LABELS[role]}
                      </Badge>
                    </div>

                    {canManageClientTeam ? (
                      <div className="shrink-0">
                        {isConfirming ? (
                          <div className="flex flex-col items-end gap-1.5 text-xs">
                            <span className="text-muted-foreground">
                              Remove {displayName} from this client?
                            </span>
                            <div className="flex gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={removingMemberId === member.id}
                                onClick={() => setConfirmRemoveId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={removingMemberId === member.id}
                                onClick={() => void handleRemoveMember(member.id)}
                              >
                                {removingMemberId === member.id ? (
                                  <Spinner className="size-3.5" />
                                ) : (
                                  "Yes"
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 text-muted-foreground"
                            aria-label={`Remove ${displayName}`}
                            onClick={() => setConfirmRemoveId(member.id)}
                          >
                            <RiCloseLine className="size-4" />
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}

          {canManageClientTeam ? (
            showInviteForm ? (
              <form
                onSubmit={(event) => void handleInvite(event)}
                className="mt-4 space-y-3 rounded-xl border border-border/70 bg-muted/15 p-4"
              >
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="colleague@firm.com"
                      autoFocus
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
                </FieldGroup>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={inviting}>
                    {inviting ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Sending…
                      </>
                    ) : (
                      "Send invite"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setShowInviteForm(true)}
              >
                <RiUserAddLine className="size-3.5" />
                Add team member
              </Button>
            )
          ) : null}
      </Panel>

      <Separator />

      <Panel title="Knowledge Base (Drive index)">
        {drive.status === "not_connected" ? (
          <p className="text-sm text-muted-foreground">
            Connect Google Drive to index documents for this client.
          </p>
        ) : driveNeedsSetup ? (
          // Connected but no folder bound: authenticated and completely inert.
          // The count would read a bare "0", which looks like an empty Drive
          // rather than a setup step nobody was told about.
          <div className="space-y-3">
            <p className="text-sm text-amber-700">
              No Drive folder bound yet — LUCA cannot index or search this
              client&apos;s documents until one is set.
            </p>
            <DriveFolderBinding
              clientId={clientId}
              boundFolderId={driveFolderId}
              onBound={() => void loadDriveIndex()}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {driveIndexCount != null ? (
                <>
                  <span className="font-medium text-foreground">{driveIndexCount}</span>{" "}
                  documents indexed
                  {driveLastSynced ? (
                    <>
                      {" "}
                      · last synced {formatTimeAgo(driveLastSynced)}
                    </>
                  ) : null}
                </>
              ) : (
                "Drive index status unavailable."
              )}
            </p>

            {driveError ? (
              <p className="text-xs text-amber-700">
                Last sync failed: {driveError}
              </p>
            ) : null}

            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={driveSearchQuery}
                onChange={(event) => setDriveSearchQuery(event.target.value)}
                placeholder="Search documents..."
                className="h-9 bg-background pl-9"
              />
            </div>

            {driveSearching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-3.5" />
                Searching…
              </div>
            ) : driveSearchQuery.trim() && driveSearchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents found.</p>
            ) : (
              <ul className="space-y-2">
                {driveSearchResults.map((result) => {
                  const filename = result.filename ?? result.name ?? "Untitled"
                  const driveUrl =
                    result.driveUrl ?? result.drive_url ?? result.webViewLink

                  return (
                    <li
                      key={result.id}
                      className="rounded-lg border border-border/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">{filename}</p>
                      {result.snippet ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {result.snippet}
                        </p>
                      ) : null}
                      {driveUrl ? (
                        <a
                          href={driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Open in Drive
                          <RiExternalLinkLine className="size-3" />
                        </a>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </Panel>

      <Separator />

      <Panel title="Recent Activity">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activities.</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => {
              const updatedAt =
                activity.updatedAt ?? activity.updated_at ?? activity.completedAt ?? activity.completed_at

              return (
                <li key={activity.id}>
                  <Link
                    href={`/activities/${activity.id}`}
                    className={cn(
                      "block rounded-lg border border-border/60 px-3 py-2.5 text-sm text-foreground transition-colors",
                      "hover:border-primary/30 hover:bg-muted/20",
                    )}
                  >
                    {formatActivitySummary(activity.name, activity.status, updatedAt)}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 gap-1 px-0 text-xs text-primary hover:bg-transparent hover:text-primary/80"
          onClick={() => {
            setSelectedClientId(clientId)
            router.push("/board")
          }}
        >
          View all on Board
          <RiArrowRightLine className="size-3.5" />
        </Button>
      </Panel>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
