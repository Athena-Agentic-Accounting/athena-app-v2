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
      data-official-content
      className={cn(
        "font-document overflow-hidden border border-border bg-card",
        className,
      )}
    >
      <header className="border-b border-border bg-muted/20 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Skill specification
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {skill.name}
              </h1>
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

      </header>

      <div className="grid min-w-0 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="border-b border-border bg-muted/10 p-5 lg:border-r lg:border-b-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-xs sm:grid-cols-4 lg:grid-cols-1">
            <SkillMetadata label="Category" value={skill.category || "Uncategorised"} />
            <SkillMetadata label="Ownership" value={core ? "Athena core" : "Firm-authored"} />
            <SkillMetadata
              label="Editing"
              value={customisable ? "Can be customised" : core ? "Read only" : "Editable"}
            />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Required systems
              </dt>
              <dd className="mt-1.5 space-y-1 text-foreground/80">
                {integrations.length > 0 ? (
                  integrations.map((key) => (
                    <span key={key} className="block">
                      {formatIntegrationLabel(key)}
                    </span>
                  ))
                ) : (
                  <span>No external systems</span>
                )}
              </dd>
            </div>
          </dl>
        </aside>

        <div className="min-w-0 px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="max-w-3xl">
            <MarkdownContent markdown={markdown} />
          </div>
        </div>
      </div>
    </article>
  )
}

function SkillMetadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-foreground/80">{value}</dd>
    </div>
  )
}
