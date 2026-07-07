"use client"

import { MarkdownContent } from "@/components/session/markdown-content"
import { Badge } from "@/components/ui/badge"
import type { ApiSkill } from "@/lib/api/skills"
import { isCoreSkill, isCustomisableSkill } from "@/lib/api/skills"
import {
  buildSkillMarkdown,
  formatIntegrationLabel,
  getRequiredIntegrations,
} from "@/lib/skills/skill-markdown"
import { cn } from "@/lib/utils"

type SkillDetailCardProps = {
  skill: ApiSkill
  className?: string
}

export function SkillDetailCard({ skill, className }: SkillDetailCardProps) {
  const integrations = getRequiredIntegrations(skill)
  const core = isCoreSkill(skill)
  const customisable = isCustomisableSkill(skill)
  const markdown = buildSkillMarkdown(skill)

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5",
        className,
      )}
    >
      <header className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-medium text-foreground">{skill.name}</h1>
              {skill.category ? (
                <Badge variant="outline" className="font-normal">
                  {skill.category}
                </Badge>
              ) : null}
            </div>
            {skill.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {skill.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={core ? "outline" : "default"}>
              {core ? "Core skill" : "Custom"}
            </Badge>
            {customisable ? (
              <Badge variant="secondary" className="font-normal">
                Customisable
              </Badge>
            ) : null}
          </div>
        </div>

        {integrations.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Requires:</span>
            {integrations.map((key) => (
              <Badge key={key} variant="outline" className="font-normal">
                {formatIntegrationLabel(key)}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <div className="px-5 py-5">
        <MarkdownContent markdown={markdown} />
      </div>
    </article>
  )
}
