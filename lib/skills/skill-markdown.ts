import type { ApiSkill } from "@/lib/api/skills"

export function getRequiredIntegrations(skill: ApiSkill): string[] {
  return skill.requiredIntegrations ?? skill.required_integrations ?? []
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

export const SKILL_BLANK_TEMPLATE = `# <Skill Name>

**Category:** <CLOSE | RECONCILIATION | ONBOARDING | ...>
**Core skill:** false
**Customisable:** true

## Description
<One or two sentences: what this skill does and why a client would run it.>

## Required Integrations
- QUICKBOOKS

## Task Sequence
1. <First task the agent performs>
2. <Second task>
3. <...>

## Expected Outputs
- <Artifact the client receives>

## Approval Gates
- After task **3**: \`gate_type\` — <what is being approved and why>
`

/** @deprecated Use SKILL_BLANK_TEMPLATE */
export const SKILL_MARKDOWN_PLACEHOLDER = SKILL_BLANK_TEMPLATE

function stringOr(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return undefined
}

function numberOr(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}
