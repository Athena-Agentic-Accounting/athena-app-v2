/**
 * Client-writable profile stored on Clerk `unsafeMetadata` under `athena`.
 * Replace with server-backed institution records when the API is ready.
 */
export type InstitutionTeamSize = "1-3" | "4-10" | "11+"

export type FinanceFocusArea =
  | "ap_ar"
  | "payroll"
  | "treasury"
  | "fpna"
  | "reporting"
  | "other"

export type TenantType = "in_house" | "accounting_firm"

export type IntegrationProvider = "quickbooks" | "google_drive"

export type IntegrationConnections = {
  quickbooks?: boolean
  googleDrive?: boolean
}

export type AthenaInstitutionProfile = {
  tenantType?: TenantType
  organizationName?: string
  firstClientName?: string
  primaryClientId?: string
  integrations?: IntegrationConnections
  invitedEmails?: string[]
  welcomeCheckCompleted?: boolean
  experience?: string
  role?: string
  payroll?: string
  teamSize?: InstitutionTeamSize
  focusAreas?: FinanceFocusArea[]
  contextNotes?: string
  chartOfAccountsUploaded?: boolean
}

export type AthenaUnsafeMetadata = {
  onboardingComplete?: boolean
  onboardingJustCompleted?: boolean
  institution?: AthenaInstitutionProfile
}

export type ClerkUnsafeMetadataShape = {
  athena?: AthenaUnsafeMetadata
  luca?: AthenaUnsafeMetadata
}

export function getAthenaMetadata(
  unsafeMetadata: Record<string, unknown> | undefined | null,
): AthenaUnsafeMetadata | undefined {
  if (!unsafeMetadata || typeof unsafeMetadata !== "object") return undefined
  const shape = unsafeMetadata as ClerkUnsafeMetadataShape
  const raw = shape.luca ?? shape.athena
  return raw && typeof raw === "object" ? raw : undefined
}

export function buildAthenaMetadataUpdate(
  existingUnsafe: Record<string, unknown> | undefined | null,
  next: AthenaUnsafeMetadata,
): Record<string, unknown> {
  const base =
    existingUnsafe && typeof existingUnsafe === "object" && !Array.isArray(existingUnsafe)
      ? { ...existingUnsafe }
      : {}
  const prev = getAthenaMetadata(base) ?? {}
  const updated = {
    ...prev,
    ...next,
    institution: {
      ...(prev.institution ?? {}),
      ...(next.institution ?? {}),
      integrations: {
        ...(prev.institution?.integrations ?? {}),
        ...(next.institution?.integrations ?? {}),
      },
    },
  }
  return {
    ...base,
    athena: updated,
    luca: updated,
  }
}

export function isQuickBooksConnected(meta?: AthenaUnsafeMetadata): boolean {
  return meta?.institution?.integrations?.quickbooks === true
}

export function isInHouseTenant(meta?: AthenaUnsafeMetadata): boolean {
  return meta?.institution?.tenantType === "in_house"
}

export function isAccountingFirmTenant(meta?: AthenaUnsafeMetadata): boolean {
  return meta?.institution?.tenantType === "accounting_firm"
}

export function getPrimaryClientName(meta?: AthenaUnsafeMetadata): string {
  if (isInHouseTenant(meta)) {
    return meta?.institution?.organizationName ?? "Your company"
  }
  return meta?.institution?.firstClientName ?? "Your client"
}
