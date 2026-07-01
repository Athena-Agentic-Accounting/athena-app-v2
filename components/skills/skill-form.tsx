"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { RiBookOpenLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillMarkdownLayout } from "@/components/skills/skill-markdown-layout"
import { PageHeader } from "@/components/shell/page-header"
import { MarkdownContent } from "@/components/session/markdown-content"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  /** When provided, shows an "Apply to" scope selector (whole firm / a client). */
  clients?: ApiClient[]
  /** Optional notice, e.g. editing a core skill creates a copy for your firm. */
  forkNotice?: string
  submitting: boolean
  onSubmit: (values: SkillFormValues) => void
}

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
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write")

  const previewMarkdown = useMemo(
    () => content.trim() || `# ${name.trim() || "Untitled skill"}`,
    [content, name],
  )

  function handleSubmit() {
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()
    const body = content.trim()

    if (!trimmedName || !trimmedCategory) {
      toast.error("Name and category are required.")
      return
    }
    if (!body || body === SKILL_MARKDOWN_PLACEHOLDER.trim()) {
      toast.error("Write the skill instructions in Markdown.")
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border/70 lg:border-r lg:border-b-0">
          <div className="shrink-0 space-y-4 border-b border-border/70 px-6 py-4">
            {forkNotice ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground ring-1 ring-inset ring-border/50">
                {forkNotice}
              </p>
            ) : null}

            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                <Input
                  id="skill-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Fixed asset roll-forward"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="skill-category">Category</FieldLabel>
                <Input
                  id="skill-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Close tasks"
                />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="skill-description">Summary (optional)</FieldLabel>
              <Input
                id="skill-description"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Roll forward prior-month schedules and reconcile to GL"
              />
            </Field>

            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="skill-integrations">Integrations</FieldLabel>
                <Input
                  id="skill-integrations"
                  value={requiredIntegrations}
                  onChange={(event) => setRequiredIntegrations(event.target.value)}
                  placeholder="quickbooks, google_drive"
                />
              </Field>
              {clients ? (
                <Field>
                  <FieldLabel htmlFor="skill-scope">Apply to</FieldLabel>
                  <select
                    id="skill-scope"
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                    className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="org">Whole firm</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </FieldGroup>

            <div className="inline-flex w-fit rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50 lg:hidden">
              <button
                type="button"
                onClick={() => setEditorTab("write")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  editorTab === "write"
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setEditorTab("preview")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  editorTab === "preview"
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Preview
              </button>
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto px-6 py-4",
              editorTab === "preview" ? "lg:hidden" : undefined,
            )}
          >
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={SKILL_MARKDOWN_PLACEHOLDER}
              className="min-h-[calc(100vh-22rem)] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-4 font-mono text-sm leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </section>

        <section
          className={cn(
            "hidden min-h-0 min-w-0 flex-1 flex-col lg:flex",
            editorTab === "preview" ? "flex" : undefined,
          )}
        >
          <div className="shrink-0 border-b border-border/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
          </div>
          <SkillMarkdownLayout className="flex-1">
            <MarkdownContent markdown={previewMarkdown} />
          </SkillMarkdownLayout>
        </section>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 px-4 py-3 lg:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button size="sm" disabled={submitting} onClick={handleSubmit}>
          {submitting ? <Spinner className="size-3.5" /> : submitLabel}
        </Button>
      </div>
    </div>
  )
}
