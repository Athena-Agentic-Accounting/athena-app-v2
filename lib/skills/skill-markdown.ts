import type { ApiSkill } from "@/lib/api/skills"
import { isCustomSkill } from "@/lib/api/skills"

export function getSkillSourceText(skill: ApiSkill): string {
  return skill.sourceText ?? skill.source_text ?? ""
}

export function getRequiredIntegrations(skill: ApiSkill): string[] {
  return skill.requiredIntegrations ?? skill.required_integrations ?? []
}

export function getExpectedOutputs(skill: ApiSkill): string[] {
  return skill.expectedOutputs ?? skill.expected_outputs ?? []
}

export function getApprovalGates(skill: ApiSkill): string[] {
  return skill.approvalGates ?? skill.approval_gates ?? []
}

export function buildSkillMarkdown(skill: ApiSkill): string {
  const sections: string[] = [`# ${skill.name}`]

  const meta: string[] = []
  if (skill.category) meta.push(`**Category:** ${skill.category}`)
  meta.push(`**Type:** ${isCustomSkill(skill) ? "Custom skill" : "Core library"}`)

  const integrations = getRequiredIntegrations(skill)
  if (integrations.length > 0) {
    meta.push(`**Required integrations:** ${integrations.join(", ")}`)
  }

  const outputs = getExpectedOutputs(skill)
  if (outputs.length > 0) {
    meta.push(`**Expected outputs:** ${outputs.join(", ")}`)
  }

  const gates = getApprovalGates(skill)
  if (gates.length > 0) {
    meta.push(`**Approval gates:** ${gates.join(", ")}`)
  }

  if (meta.length > 0) {
    sections.push(meta.join("  \n"))
  }

  if (skill.description?.trim()) {
    sections.push(skill.description.trim())
  }

  const sourceText = getSkillSourceText(skill).trim()
  if (sourceText) {
    sections.push("---", "## Instructions", sourceText)
  }

  return sections.join("\n\n")
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
