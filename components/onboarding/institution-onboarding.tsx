"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useOrganization, useUser } from "@clerk/nextjs"
import { RiArrowLeftSLine, RiBriefcaseLine, RiBuildingLine } from "@remixicon/react"
import type { RemixiconComponentType } from "@remixicon/react"

import { IntegrationConnectCard } from "@/components/onboarding/integration-connect-card"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  createClient,
  inviteClientMember,
  type ClientMemberRole,
} from "@/lib/api/clients"
import {
  buildAthenaMetadataUpdate,
  getAthenaMetadata,
  type TenantType,
} from "@/lib/athena/user-metadata"
import { connectIntegration } from "@/lib/integrations/connect-integration"
import {
  getNextStepId,
  getOnboardingSteps,
  getPreviousStepId,
  getStepIndex,
  type OnboardingStepId,
} from "@/lib/onboarding/steps"
import { cn } from "@/lib/utils"

type InstitutionOnboardingProps = {
  returnPath: string
}

function TenantTypeOption({
  selected,
  title,
  description,
  icon: Icon,
  onSelect,
}: {
  selected: boolean
  title: string
  description: string
  icon: RemixiconComponentType
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border/70 bg-card hover:bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
          selected
            ? "bg-primary/10 ring-primary/30"
            : "bg-muted ring-border/50",
        )}
      >
        <Icon
          className={cn(
            "size-4",
            selected ? "text-primary" : "text-muted-foreground",
          )}
        />
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <span className="text-sm text-foreground">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
    </button>
  )
}

const INVITE_ROLES: { value: ClientMemberRole; label: string }[] = [
  { value: "client_manager", label: "Manager" },
  { value: "client_reviewer", label: "Reviewer" },
  { value: "client_observer", label: "Observer" },
]

export function InstitutionOnboarding({ returnPath }: InstitutionOnboardingProps) {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()

  const savedMeta = useMemo(
    () =>
      getAthenaMetadata(user?.unsafeMetadata as Record<string, unknown> | undefined),
    [user?.unsafeMetadata],
  )

  const [tenantType, setTenantType] = useState<TenantType | undefined>(
    savedMeta?.institution?.tenantType,
  )
  const [organizationName, setOrganizationName] = useState(
    savedMeta?.institution?.organizationName ?? "",
  )
  const [firstClientName, setFirstClientName] = useState(
    savedMeta?.institution?.firstClientName ?? "",
  )
  const [primaryClientId, setPrimaryClientId] = useState(
    savedMeta?.institution?.primaryClientId ?? "",
  )
  const [quickbooksConnected, setQuickbooksConnected] = useState(
    savedMeta?.institution?.integrations?.quickbooks === true,
  )
  const [googleDriveConnected, setGoogleDriveConnected] = useState(
    savedMeta?.institution?.integrations?.googleDrive === true,
  )
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<ClientMemberRole>("client_reviewer")
  const [inviteEmails, setInviteEmails] = useState<string[]>(
    savedMeta?.institution?.invitedEmails ?? [],
  )

  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>("tenant-type")
  const [connectingProvider, setConnectingProvider] = useState<
    "quickbooks" | "google_drive" | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Workspaces are provisioned by the Athena team on the Clerk dashboard, so
  // the dashboard org name is authoritative — prefill it when nothing saved.
  useEffect(() => {
    const dashboardName = organization?.name?.trim()
    if (!dashboardName) return
    setOrganizationName((current) => (current.trim() ? current : dashboardName))
  }, [organization?.name])

  const steps = useMemo(() => getOnboardingSteps(tenantType), [tenantType])
  const currentStep = steps.find((step) => step.id === currentStepId) ?? steps[0]
  const stepIndex = getStepIndex(steps, currentStepId)
  const stepLabel =
    stepIndex >= 0 ? `Step ${stepIndex + 1} of ${steps.length}` : undefined

  useEffect(() => {
    if (!isLoaded || !savedMeta) return

    const savedTenantType = savedMeta.institution?.tenantType
    const savedSteps = getOnboardingSteps(savedTenantType)

    if (!savedTenantType) {
      setCurrentStepId("tenant-type")
      return
    }

    setTenantType(savedTenantType)
    if (savedMeta.institution?.primaryClientId) {
      setPrimaryClientId(savedMeta.institution.primaryClientId)
    }

    if (!savedMeta.institution?.organizationName) {
      setCurrentStepId("organization-name")
      return
    }

    if (
      savedTenantType === "accounting_firm" &&
      !savedMeta.institution.firstClientName
    ) {
      setCurrentStepId("add-first-client")
      return
    }

    if (!savedMeta.institution.primaryClientId) {
      if (savedTenantType === "in_house" && savedMeta.institution.organizationName) {
        setCurrentStepId("connect-quickbooks")
        return
      }
      if (savedTenantType === "accounting_firm") {
        setCurrentStepId("add-first-client")
        return
      }
    }

    if (!savedMeta.institution.integrations?.quickbooks) {
      setCurrentStepId("connect-quickbooks")
      return
    }

    if (savedTenantType === "accounting_firm") {
      setCurrentStepId("invite-team")
      return
    }

    setCurrentStepId("connect-google-drive")
  }, [isLoaded, savedMeta])

  async function persistMetadata(
    patch: Parameters<typeof buildAthenaMetadataUpdate>[1],
  ) {
    if (!user) return
    await user.update({
      unsafeMetadata: buildAthenaMetadataUpdate(user.unsafeMetadata, patch),
    })
  }

  function goToStep(stepId: OnboardingStepId) {
    setError(null)
    setCurrentStepId(stepId)
  }

  function goNext() {
    const next = getNextStepId(steps, currentStepId)
    if (next) goToStep(next)
  }

  function goBack() {
    const previous = getPreviousStepId(steps, currentStepId)
    if (previous) goToStep(previous)
  }

  async function handleTenantTypeContinue() {
    if (!tenantType) {
      setError("Choose the option that best describes you.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await persistMetadata({
        institution: { tenantType },
      })
      goToStep("organization-name")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your selection.")
    } finally {
      setLoading(false)
    }
  }

  async function handleOrganizationContinue() {
    const trimmed = organizationName.trim()
    if (!trimmed) {
      setError(
        tenantType === "accounting_firm"
          ? "Enter your firm name to continue."
          : "Enter your company name to continue.",
      )
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = await getToken()

      if (tenantType === "in_house") {
        const client = await createClient(token, trimmed)
        setPrimaryClientId(client.id)
        await persistMetadata({
          institution: {
            organizationName: trimmed,
            primaryClientId: client.id,
          },
        })
      } else {
        await persistMetadata({
          institution: { organizationName: trimmed },
        })
      }

      goNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your organization.")
    } finally {
      setLoading(false)
    }
  }

  async function handleFirstClientContinue() {
    const trimmed = firstClientName.trim()
    if (!trimmed) {
      setError("Enter a client name to continue.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const client = await createClient(token, trimmed)
      setPrimaryClientId(client.id)
      await persistMetadata({
        institution: {
          firstClientName: trimmed,
          primaryClientId: client.id,
        },
      })
      goNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your client.")
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(provider: "quickbooks" | "google_drive") {
    if (!primaryClientId) {
      setError("Client setup is incomplete. Go back and enter your company or client name.")
      return
    }

    setConnectingProvider(provider)
    setError(null)
    try {
      const token = await getToken()
      await connectIntegration(provider, {
        token,
        clientId: primaryClientId,
      })

      if (provider === "quickbooks") {
        setQuickbooksConnected(true)
        await persistMetadata({
          institution: {
            integrations: { quickbooks: true },
          },
        })
      } else {
        setGoogleDriveConnected(true)
        await persistMetadata({
          institution: {
            integrations: { googleDrive: true },
          },
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Try again.")
    } finally {
      setConnectingProvider(null)
    }
  }

  async function finishOnboarding() {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const token = await getToken()

      if (inviteEmails.length > 0 && primaryClientId) {
        const failures: string[] = []
        for (const email of inviteEmails) {
          try {
            await inviteClientMember(token, primaryClientId, email, inviteRole)
          } catch (err) {
            failures.push(
              `${email}: ${err instanceof Error ? err.message : "Invite failed"}`,
            )
          }
        }
        if (failures.length === inviteEmails.length) {
          setError(failures.join(" · "))
          return
        }
        if (failures.length > 0) {
          setError(`Some invites failed: ${failures.join(" · ")}`)
        }
      }

      await persistMetadata({
        onboardingComplete: true,
        onboardingJustCompleted: true,
        institution: {
          invitedEmails: inviteEmails.length > 0 ? inviteEmails : undefined,
        },
      })
      router.replace(returnPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete onboarding.")
    } finally {
      setLoading(false)
    }
  }

  function handleAddInvite() {
    const trimmed = inviteEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.")
      return
    }
    if (inviteEmails.includes(trimmed)) {
      setError("That teammate is already on the list.")
      return
    }
    setInviteEmails((prev) => [...prev, trimmed])
    setInviteEmail("")
    setError(null)
  }

  function renderStepContent() {
    switch (currentStepId) {
      case "tenant-type":
        return (
          <div className="flex flex-col gap-3">
            <TenantTypeOption
              selected={tenantType === "in_house"}
              title="I'm part of an in-house finance team"
              description="One company, one workspace — no client list or switcher."
              icon={RiBuildingLine}
              onSelect={() => setTenantType("in_house")}
            />
            <TenantTypeOption
              selected={tenantType === "accounting_firm"}
              title="I'm at an accounting firm with multiple clients"
              description="Manage many clients with scoped views and a client switcher."
              icon={RiBriefcaseLine}
              onSelect={() => setTenantType("accounting_firm")}
            />
          </div>
        )

      case "organization-name":
        return (
          <Field>
            <FieldLabel htmlFor="organization-name">
              {tenantType === "accounting_firm" ? "Firm name" : "Company name"}
            </FieldLabel>
            <Input
              id="organization-name"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder={
                tenantType === "accounting_firm"
                  ? "Coastal Accounting Partners"
                  : "FinFlow Ltd"
              }
              autoFocus
            />
          </Field>
        )

      case "add-first-client":
        return (
          <Field>
            <FieldLabel htmlFor="first-client-name">Client name</FieldLabel>
            <Input
              id="first-client-name"
              value={firstClientName}
              onChange={(event) => setFirstClientName(event.target.value)}
              placeholder="FinFlow Ltd"
              autoFocus
            />
          </Field>
        )

      case "connect-quickbooks":
        return (
          <IntegrationConnectCard
            provider="quickbooks"
            connected={quickbooksConnected}
            connecting={connectingProvider === "quickbooks"}
            onConnect={() => handleConnect("quickbooks")}
            optional
          />
        )

      case "connect-google-drive":
        return (
          <IntegrationConnectCard
            provider="google_drive"
            connected={googleDriveConnected}
            connecting={connectingProvider === "google_drive"}
            onConnect={() => handleConnect("google_drive")}
            optional
          />
        )

      case "invite-team":
        return (
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as ClientMemberRole)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {INVITE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="teammate@firm.com"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleAddInvite()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddInvite}>
                Add
              </Button>
            </div>
            {inviteEmails.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {inviteEmails.map((email) => (
                  <li
                    key={email}
                    className="rounded-lg border border-border/70 px-3 py-2 text-sm text-foreground"
                  >
                    {email}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Skip for now if you are setting up solo — you can invite later.
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  function renderPrimaryAction() {
    switch (currentStepId) {
      case "tenant-type":
        return (
          <Button className="w-full" disabled={loading} onClick={handleTenantTypeContinue}>
            {loading ? (
              <>
                <Spinner data-icon="inline-start" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        )

      case "organization-name":
        return (
          <Button className="w-full" disabled={loading} onClick={handleOrganizationContinue}>
            {loading ? (
              <>
                <Spinner data-icon="inline-start" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        )

      case "add-first-client":
        return (
          <Button className="w-full" disabled={loading} onClick={handleFirstClientContinue}>
            {loading ? (
              <>
                <Spinner data-icon="inline-start" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        )

      case "connect-quickbooks":
        return (
          <Button className="w-full" disabled={loading} onClick={goNext}>
            {quickbooksConnected ? "Continue" : "Connect later — continue"}
          </Button>
        )

      case "connect-google-drive":
        return (
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => {
                if (tenantType === "accounting_firm") {
                  goNext()
                  return
                }
                void finishOnboarding()
              }}
            >
              {loading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Setting up workspace…
                </>
              ) : googleDriveConnected ? (
                "Continue"
              ) : (
                "Connect later — continue"
              )}
            </Button>
          </div>
        )

      case "invite-team":
        return (
          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={loading} onClick={finishOnboarding}>
              {loading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Setting up workspace…
                </>
              ) : inviteEmails.length > 0 ? (
                "Send invites & continue"
              ) : (
                "Skip for now"
              )}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <OnboardingShell
      title={currentStep.title}
      description={currentStep.description}
      stepLabel={stepLabel}
      backAction={
        stepIndex > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-full bg-muted px-3 text-xs font-normal text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            onClick={goBack}
            disabled={loading || connectingProvider !== null}
          >
            <RiArrowLeftSLine className="size-3.5" />
            Back
          </Button>
        ) : null
      }
      footer={
        <>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {renderPrimaryAction()}
        </>
      }
    >
      {renderStepContent()}
    </OnboardingShell>
  )
}
