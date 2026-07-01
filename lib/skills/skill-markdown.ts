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

export const SKILL_MARKDOWN_PLACEHOLDER = `## Overview

Describe what this skill does and when an accountant should run it.

## Steps

1. First step…
2. Second step…

## Notes

- Edge cases
- Required approvals
`
