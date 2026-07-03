"use client"

import { RiLockLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { ApiSkill } from "@/lib/api/skills"
import { isCoreSkill, isCustomisableSkill } from "@/lib/api/skills"
import {
  formatIntegrationLabel,
  getApprovalGates,
  getExpectedOutputs,
  getRequiredIntegrations,
  getTaskSequence,
} from "@/lib/skills/skill-markdown"
import { cn } from "@/lib/utils"

type SkillDetailCardProps = {
  skill: ApiSkill
  className?: string
}

export function SkillDetailCard({ skill, className }: SkillDetailCardProps) {
  const integrations = getRequiredIntegrations(skill)
  const steps = getTaskSequence(skill)
  const outputs = getExpectedOutputs(skill)
  const gates = getApprovalGates(skill)
  const core = isCoreSkill(skill)
  const customisable = isCustomisableSkill(skill)

  const gatesByStep = new Map(gates.map((gate) => [gate.afterTaskOrder, gate]))

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

        {steps.length > 0 || gates.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {steps.length > 0 ? `${steps.length} step${steps.length === 1 ? "" : "s"}` : null}
            {steps.length > 0 && gates.length > 0 ? " · " : null}
            {gates.length > 0
              ? `${gates.length} approval gate${gates.length === 1 ? "" : "s"}`
              : null}
          </p>
        ) : null}
      </header>

      <div className="space-y-6 px-5 py-5">
        {steps.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Task sequence</h2>
            <ol className="space-y-0">
              {steps.map((step) => {
                const gate = gatesByStep.get(step.order)

                return (
                  <li key={step.order} className="relative">
                    <div className="flex gap-3 py-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-xs font-medium text-muted-foreground">
                        {step.order}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm text-foreground">{step.task}</p>
                        {step.details ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {step.details}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {gate ? (
                      <div className="mb-2 ml-9 flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <RiLockLine className="mt-0.5 size-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                        <div className="min-w-0 text-xs">
                          <p className="font-medium text-amber-900 dark:text-amber-200">
                            Approval required: {gate.gateType}
                          </p>
                          <p className="mt-0.5 leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                            {gate.description}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        {outputs.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Expected outputs</h2>
            <div className="flex flex-wrap gap-2">
              {outputs.map((output) => (
                <Badge key={output} variant="secondary" className="font-normal">
                  {output}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {steps.length === 0 && outputs.length === 0 && !skill.description ? (
          <p className="text-sm text-muted-foreground">
            No structured task sequence yet. This skill may still use free-form instructions.
          </p>
        ) : null}
      </div>
    </article>
  )
}
