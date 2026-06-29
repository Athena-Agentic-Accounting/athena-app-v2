export const ACTIVITY_CATEGORIES = [
  { value: "data_ingestion", letter: "A", label: "Data ingestion & preparation" },
  { value: "setup_onboarding", letter: "B", label: "Setup & onboarding" },
  { value: "bookkeeping", letter: "C", label: "Bookkeeping & transaction processing" },
  { value: "reconciliations", letter: "D", label: "Reconciliations" },
  { value: "accounts_payable", letter: "E", label: "Accounts Payable" },
  { value: "accounts_receivable", letter: "F", label: "Accounts Receivable" },
  { value: "payroll", letter: "G", label: "Payroll" },
  { value: "period_close", letter: "H", label: "Period close & adjustments" },
  { value: "fixed_assets_inventory", letter: "I", label: "Fixed assets & inventory" },
  { value: "tax_statutory", letter: "J", label: "Tax & statutory" },
  { value: "financial_reporting", letter: "K", label: "Financial reporting" },
  { value: "fpa_analysis", letter: "L", label: "FP&A / analysis" },
  { value: "audit_assurance", letter: "M", label: "Audit & assurance" },
  { value: "controls_treasury", letter: "N", label: "Controls, treasury & governance" },
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]["value"]

export const DEFAULT_ACTIVITY_CATEGORY: ActivityCategory = "period_close"

const LEGACY_CATEGORY_MAP: Record<string, ActivityCategory> = {
  close_task: "period_close",
  reconciliation: "reconciliations",
  reporting: "financial_reporting",
  analysis: "fpa_analysis",
}

export function normalizeActivityCategory(value?: string | null): ActivityCategory | null {
  if (!value?.trim()) return null

  const normalized = value.trim().toLowerCase()
  const direct = ACTIVITY_CATEGORIES.find((entry) => entry.value === normalized)
  if (direct) return direct.value

  return LEGACY_CATEGORY_MAP[normalized] ?? null
}

export function getActivityCategoryMeta(value?: string | null) {
  const normalized = normalizeActivityCategory(value)
  if (!normalized) return null
  return ACTIVITY_CATEGORIES.find((entry) => entry.value === normalized) ?? null
}

export function formatActivityCategory(value?: string | null): string {
  const meta = getActivityCategoryMeta(value)
  if (meta) return `${meta.letter} · ${meta.label}`

  if (!value?.trim()) return "General"

  const normalized = value.trim()
  if (normalized.toUpperCase() === "AD_HOC") return "Ad hoc"

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}
