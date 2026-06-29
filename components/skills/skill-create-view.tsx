"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RiBookOpenLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillMarkdownLayout } from "@/components/skills/skill-markdown-layout"
import { PageHeader } from "@/components/shell/page-header"
import { MarkdownContent } from "@/components/session/markdown-content"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { createSkill } from "@/lib/api/skills"
import { SKILL_MARKDOWN_PLACEHOLDER } from "@/lib/skills/skill-markdown"
import { cn } from "@/lib/utils"

type SkillDefinitionMode = "sourceText" | "taskSequence"

function parseCommaList(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

export function SkillCreateView() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { canManageSkills } = useWorkspacePermissions()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [sourceText, setSourceText] = useState("")
  const [taskSequenceJson, setTaskSequenceJson] = useState("")
  const [requiredIntegrations, setRequiredIntegrations] = useState("")
  const [expectedOutputs, setExpectedOutputs] = useState("")
  const [approvalGates, setApprovalGates] = useState("")
  const [definitionMode, setDefinitionMode] = useState<SkillDefinitionMode>("sourceText")
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!canManageSkills) {
      router.replace("/skills")
    }
  }, [canManageSkills, router])

  useEffect(() => {
    setSourceText((current) => current || SKILL_MARKDOWN_PLACEHOLDER)
  }, [])

  const previewMarkdown = useMemo(() => {
    const trimmedName = name.trim() || "Untitled skill"
    const sections = [`# ${trimmedName}`]

    const meta: string[] = []
    if (category.trim()) meta.push(`**Category:** ${category.trim()}`)
    meta.push("**Type:** Custom skill")
    if (requiredIntegrations.trim()) {
      meta.push(`**Required integrations:** ${requiredIntegrations.trim()}`)
    }
    if (expectedOutputs.trim()) {
      meta.push(`**Expected outputs:** ${expectedOutputs.trim()}`)
    }
    if (approvalGates.trim()) {
      meta.push(`**Approval gates:** ${approvalGates.trim()}`)
    }
    if (meta.length > 0) sections.push(meta.join("  \n"))

    if (description.trim()) sections.push(description.trim())

    if (definitionMode === "sourceText") {
      const body = sourceText.trim()
      if (body) sections.push("---", "## Instructions", body)
    } else if (taskSequenceJson.trim()) {
      sections.push("---", "## Task sequence", "```json", taskSequenceJson.trim(), "```")
    }

    return sections.join("\n\n")
  }, [
    approvalGates,
    category,
    definitionMode,
    description,
    expectedOutputs,
    name,
    requiredIntegrations,
    sourceText,
    taskSequenceJson,
  ])

  async function handleSubmit() {
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()

    if (!trimmedName || !trimmedCategory) {
      toast.error("Name and category are required.")
      return
    }

    let taskSequence: unknown | undefined
    if (definitionMode === "sourceText") {
      const body = sourceText.trim()
      if (!body || body === SKILL_MARKDOWN_PLACEHOLDER.trim()) {
        toast.error("Write the skill instructions in Markdown, or switch to task sequence mode.")
        return
      }
    } else {
      if (!taskSequenceJson.trim()) {
        toast.error("Provide a task sequence JSON array.")
        return
      }
      try {
        taskSequence = JSON.parse(taskSequenceJson) as unknown
      } catch {
        toast.error("Task sequence must be valid JSON.")
        return
      }
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const created = await createSkill(token, {
        name: trimmedName,
        category: trimmedCategory,
        description: description.trim() || undefined,
        sourceText: definitionMode === "sourceText" ? sourceText.trim() : undefined,
        taskSequence: definitionMode === "taskSequence" ? taskSequence : undefined,
        requiredIntegrations: parseCommaList(requiredIntegrations),
        expectedOutputs: parseCommaList(expectedOutputs),
        approvalGates: parseCommaList(approvalGates),
      })
      toast.success("Skill created", { description: trimmedName })
      router.push(`/skills/${created.id}`)
    } catch (err) {
      toast.error("Could not create skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="New skill"
        description="Write your workflow as a Markdown document"
        icon={RiBookOpenLine}
        showSearch={false}
        breadcrumbs={[
          { label: "Skills", href: "/skills" },
          { label: "New skill" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/skills">Cancel</Link>
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? <Spinner className="size-3.5" /> : "Create skill"}
            </Button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border/70 lg:border-r lg:border-b-0">
          <div className="shrink-0 space-y-4 border-b border-border/70 px-6 py-4">
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
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Roll forward prior-month schedules and reconcile to GL"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50">
                <button
                  type="button"
                  onClick={() => setDefinitionMode("sourceText")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    definitionMode === "sourceText"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setDefinitionMode("taskSequence")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    definitionMode === "taskSequence"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Task sequence
                </button>
              </div>

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

            <FieldGroup className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="skill-integrations">Integrations</FieldLabel>
                <Input
                  id="skill-integrations"
                  value={requiredIntegrations}
                  onChange={(event) => setRequiredIntegrations(event.target.value)}
                  placeholder="quickbooks, google_drive"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="skill-outputs">Outputs</FieldLabel>
                <Input
                  id="skill-outputs"
                  value={expectedOutputs}
                  onChange={(event) => setExpectedOutputs(event.target.value)}
                  placeholder="Reconciled schedule"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="skill-gates">Approval gates</FieldLabel>
                <Input
                  id="skill-gates"
                  value={approvalGates}
                  onChange={(event) => setApprovalGates(event.target.value)}
                  placeholder="post_je"
                />
              </Field>
            </FieldGroup>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto px-6 py-4",
              editorTab === "preview" ? "lg:hidden" : undefined,
            )}
          >
            {definitionMode === "sourceText" ? (
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={SKILL_MARKDOWN_PLACEHOLDER}
                className="min-h-[calc(100vh-22rem)] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-4 font-mono text-sm leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            ) : (
              <textarea
                value={taskSequenceJson}
                onChange={(event) => setTaskSequenceJson(event.target.value)}
                placeholder='[{"step": "Fetch GL", "action": "..."}]'
                className="min-h-[calc(100vh-22rem)] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-4 font-mono text-xs leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            )}
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
          <Link href="/skills">Cancel</Link>
        </Button>
        <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? <Spinner className="size-3.5" /> : "Create skill"}
        </Button>
      </div>
    </div>
  )
}
