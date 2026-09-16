import type { TenantType } from "@/lib/athena/user-metadata"

export type OnboardingStepId =
  | "tenant-type"
  | "organization-name"
  | "add-first-client"
  | "connect-quickbooks"
  | "connect-google-drive"
  | "invite-team"

export type OnboardingStep = {
  id: OnboardingStepId
  title: string
  description?: string
}

export function getOnboardingSteps(tenantType?: TenantType): OnboardingStep[] {
  if (!tenantType) {
    return [
      {
        id: "tenant-type",
        title: "What best describes you?",
        description:
          "You can manage this later, but it shapes how your workspace is organized.",
      },
    ]
  }

  if (tenantType === "in_house") {
    return [
      {
        id: "tenant-type",
        title: "What best describes you?",
        description:
          "You can manage this later, but it shapes how your workspace is organized.",
      },
      {
        id: "organization-name",
        title: "What's your company called?",
      },
      {
        id: "connect-quickbooks",
        title: "Connect QuickBooks Online",
        description: "Optional for now — connect later from settings when you're ready.",
      },
      {
        id: "connect-google-drive",
        title: "Connect Google Drive",
        description: "Optional — you can connect this later from settings.",
      },
    ]
  }

  return [
    {
      id: "tenant-type",
      title: "What best describes you?",
      description:
        "You can manage this later, but it shapes how your workspace is organized.",
    },
    {
      id: "organization-name",
      title: "What's your firm called?",
    },
    {
      id: "add-first-client",
      title: "Add your first client",
      description: "Every screen in LUCA scopes to a client — start with one.",
    },
    {
      id: "connect-quickbooks",
      title: "Connect QuickBooks for this client",
      description: "Optional for now — connect later from settings when you're ready.",
    },
    {
      id: "connect-google-drive",
      title: "Connect Google Drive for this client",
      description: "Optional — you can connect this later.",
    },
    {
      id: "invite-team",
      title: "Invite your team",
      description: "Optional — add teammates now or skip and invite later.",
    },
  ]
}

export function getStepIndex(
  steps: OnboardingStep[],
  stepId: OnboardingStepId,
): number {
  return steps.findIndex((step) => step.id === stepId)
}

export function getNextStepId(
  steps: OnboardingStep[],
  currentId: OnboardingStepId,
): OnboardingStepId | null {
  const index = getStepIndex(steps, currentId)
  if (index < 0 || index >= steps.length - 1) return null
  return steps[index + 1].id
}

export function getPreviousStepId(
  steps: OnboardingStep[],
  currentId: OnboardingStepId,
): OnboardingStepId | null {
  const index = getStepIndex(steps, currentId)
  if (index <= 0) return null
  return steps[index - 1].id
}
