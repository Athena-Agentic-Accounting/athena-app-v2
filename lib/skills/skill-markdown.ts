import type { ApiSkill } from "@/lib/api/skills"

export function getRequiredIntegrations(skill: ApiSkill): string[] {
  return skill.requiredIntegrations ?? skill.required_integrations ?? []
}

const INTEGRATION_LABELS: Record<string, string> = {
  QUICKBOOKS: "QuickBooks",
  GOOGLE_DRIVE: "Google Drive",
  XERO: "Xero",
  PLAID: "Plaid",
}

export function formatIntegrationLabel(key: string): string {
  const normalized = key.trim().toUpperCase()
  if (INTEGRATION_LABELS[normalized]) return INTEGRATION_LABELS[normalized]
  return normalized
    .split(/[_\s]+/)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}

export function getSkillContent(skill: ApiSkill): string {
  return skill.content ?? ""
}

/**
 * The skill body is now an authored Markdown document (stored in S3, inlined as
 * `content` by GET /api/skills/:id). Render it directly; fall back to a minimal
 * heading if the body hasn't loaded yet.
 */
export function buildSkillMarkdown(skill: ApiSkill): string {
  const content = getSkillContent(skill).trim()
  if (content) return content
  return `# ${skill.name}`
}

export const SKILL_BLANK_TEMPLATE = `## Objective
Describe the accounting outcome this procedure must achieve.

## When to run
- Define the event, period, or condition that triggers this skill.

## Required records
- List the ledgers, schedules, contracts, or supporting documents needed.

## Procedure
1. Describe the first action and the records it uses.
2. Describe the validation or reconciliation step.
3. Describe how the final workpaper is prepared.

## Deliverables
| Deliverable | Format | Review requirement |
| --- | --- | --- |
| Name the expected workpaper | Spreadsheet or journal entry | Preparer review |

## Control checks
- State the totals, tie-outs, or evidence required before completion.

## Approval requirements
- Identify the point where reviewer approval is required.

## Exception handling
- Explain what the agent should do when records are missing or do not reconcile.
`

/** @deprecated Use SKILL_BLANK_TEMPLATE */
export const SKILL_MARKDOWN_PLACEHOLDER = SKILL_BLANK_TEMPLATE
