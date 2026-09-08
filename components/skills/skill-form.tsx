"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { RiBookOpenLine, RiCodeLine, RiEyeLine, RiInformationLine } from "@remixicon/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shell/page-header"
import { MarkdownContent } from "@/components/session/markdown-content"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ApiClient } from "@/lib/api/clients"
import { SKILL_MARKDOWN_PLACEHOLDER } from "@/lib/skills/skill-markdown"
import { cn } from "@/lib/utils"

export type SkillFormValues = {
  name: string
  category: string
  description?: string
  requiredIntegrations?: string[]
  content: string
  clientId?: string | null
}

type SkillFormProps = {
  title: string
  description: string
  breadcrumbs: { label: string; href?: string }[]
  submitLabel: string
  cancelHref: string
  initial?: Partial<SkillFormValues>
  clients?: ApiClient[]
  forkNotice?: string
  submitting: boolean
  onSubmit: (values: SkillFormValues) => void
}

type EditorSection = "details" | "instructions" | "preview"

const EDITOR_SECTIONS: {
  id: EditorSection
  label: string
  icon: typeof RiInformationLine
}[] = [
  { id: "details", label: "Details", icon: RiInformationLine },
  { id: "instructions", label: "Instructions", icon: RiCodeLine },
  { id: "preview", label: "Review", icon: RiEyeLine },
]

function parseCommaList(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

export function SkillForm({
  title,
  description,
  breadcrumbs,
  submitLabel,
  cancelHref,
  initial,
  clients,
  forkNotice,
  submitting,
  onSubmit,
}: SkillFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [summary, setSummary] = useState(initial?.description ?? "")
  const [requiredIntegrations, setRequiredIntegrations] = useState(
    (initial?.requiredIntegrations ?? []).join(", "),
  )
  const [content, setContent] = useState(initial?.content || SKILL_MARKDOWN_PLACEHOLDER)
  const [scope, setScope] = useState<string>(initial?.clientId ?? "org")
  const [activeSection, setActiveSection] = useState<EditorSection>("details")

  const previewMarkdown = useMemo(
    () => content.trim() || "## Instructions\nAdd the procedure this skill should follow.",
    [content],
  )
  const contentStats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const lines = content ? content.split("\n").length : 0
    return { words, lines }
  }, [content])

  function handleSubmit() {
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()
    const body = content.trim()

    if (!trimmedName || !trimmedCategory) {
      setActiveSection("details")
      toast.error("Name and category are required.")
      return
    }
    if (!body || body === SKILL_MARKDOWN_PLACEHOLDER.trim()) {
      setActiveSection("instructions")
      toast.error("Replace the starter guidance with the skill instructions.")
      return
    }

    onSubmit({
      name: trimmedName,
      category: trimmedCategory,
      description: summary.trim() || undefined,
      requiredIntegrations: parseCommaList(requiredIntegrations),
      content: body,
      clientId: scope === "org" ? null : scope,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={title}
        description={description}
        icon={RiBookOpenLine}
        showSearch={false}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button size="sm" disabled={submitting} onClick={handleSubmit}>
              {submitting ? <Spinner className="size-3.5" /> : submitLabel}
            </Button>
          </div>
        }
      />

      <nav className="shrink-0 border-b border-border bg-background px-5 sm:px-6" aria-label="Skill editor sections">
        <div className="mx-auto flex w-full max-w-5xl" role="tablist">
          {EDITOR_SECTIONS.map((section, index) => {
            const Icon = section.icon
            const selected = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex h-12 min-w-0 items-center gap-2 border-b-2 px-3 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-w-36",
                  selected
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <span className="font-document text-[10px] tabular-nums text-muted-foreground">{index + 1}</span>
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {activeSection === "details" ? (
          <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
            <SectionIntroduction
              eyebrow="Skill details"
              title="Define the procedure"
              description="Give the skill a clear accounting purpose, ownership scope, and the systems it may use."
            />

            {forkNotice ? (
              <p className="mb-8 border-l-2 border-primary bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
                {forkNotice}
              </p>
            ) : null}

            <div className="space-y-10">
              <section aria-labelledby="skill-identity-heading">
                <SectionHeading
                  id="skill-identity-heading"
                  title="Identity"
                  description="How accountants will find and understand this skill."
                />

                <FieldGroup className="gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                      <Input id="skill-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Fixed asset roll-forward" />
                      <FieldDescription className="text-xs">Use the action or procedure accountants will recognise.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="skill-category">Category</FieldLabel>
                      <Input id="skill-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Close tasks" />
                      <FieldDescription className="text-xs">Groups the skill in the procedure library.</FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="skill-description">Purpose</FieldLabel>
                    <Input id="skill-description" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Roll forward prior-month schedules and reconcile to the general ledger" />
                    <FieldDescription className="text-xs">One sentence describing the result this skill should produce.</FieldDescription>
                  </Field>
                </FieldGroup>
              </section>

              <section aria-labelledby="skill-access-heading">
                <SectionHeading
                  id="skill-access-heading"
                  title="Access and scope"
                  description="Where the procedure applies and which connected systems it can use."
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="skill-integrations">Required systems</FieldLabel>
                    <Input id="skill-integrations" value={requiredIntegrations} onChange={(event) => setRequiredIntegrations(event.target.value)} placeholder="quickbooks, google_drive" />
                    <FieldDescription className="text-xs">Enter system keys separated by commas.</FieldDescription>
                  </Field>

                  {clients ? (
                    <Field>
                      <FieldLabel htmlFor="skill-scope">Applies to</FieldLabel>
                      <select id="skill-scope" value={scope} onChange={(event) => setScope(event.target.value)} className="h-9 border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                        <option value="org">Whole firm</option>
                        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                      </select>
                      <FieldDescription className="text-xs">Choose firm-wide availability or a single client.</FieldDescription>
                    </Field>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="mt-10 flex justify-end border-t border-border pt-5">
              <Button size="sm" onClick={() => setActiveSection("instructions")}>Continue to instructions</Button>
            </div>
          </main>
        ) : null}

        {activeSection === "instructions" ? (
          <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionIntroduction
                eyebrow="Instructions"
                title="Write the operating procedure"
                description="Replace the starter guidance with the records, actions, controls, and approvals Athena should follow."
                className="mb-0"
              />
              <span className="font-document shrink-0 text-[10px] tabular-nums text-muted-foreground">{contentStats.words} words / {contentStats.lines} lines</span>
            </div>

            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={SKILL_MARKDOWN_PLACEHOLDER} spellCheck aria-label="Skill instructions in Markdown" className="mt-6 min-h-[32rem] w-full flex-1 resize-y border border-input bg-muted/10 px-5 py-5 font-mono text-[13px] leading-6 text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />

            <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
              <Button variant="outline" size="sm" onClick={() => setActiveSection("details")}>Back to details</Button>
              <Button size="sm" onClick={() => setActiveSection("preview")}>Review document</Button>
            </div>
          </main>
        ) : null}

        {activeSection === "preview" ? (
          <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionIntroduction eyebrow="Final review" title="Confirm the skill specification" className="mb-0" />
              <Button variant="outline" size="sm" onClick={() => setActiveSection("instructions")}>Edit instructions</Button>
            </div>

            <article className="font-document border border-border bg-card" data-official-content>
              <header className="border-b border-border bg-muted/20 px-5 py-5 sm:px-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Skill specification</p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-foreground">{name.trim() || "Untitled skill"}</h2>
                {summary.trim() ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{summary.trim()}</p> : null}
                <p className="mt-3 text-xs text-muted-foreground">{category.trim() || "Uncategorised"} / {scope === "org" ? "Whole firm" : "Client-specific"}</p>
              </header>
              <div className="px-5 py-7 sm:px-8 sm:py-9">
                <MarkdownContent markdown={previewMarkdown} />
              </div>
            </article>
          </main>
        ) : null}
      </div>
    </div>
  )
}

function SectionIntroduction({ eyebrow, title, description, className }: { eyebrow: string; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("mb-9 max-w-xl", className)}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-xl font-medium tracking-tight text-foreground">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-5 border-b border-border pb-3">
      <h2 id={id} className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
