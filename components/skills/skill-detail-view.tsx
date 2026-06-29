"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RiArrowLeftLine, RiBookOpenLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillMarkdownLayout } from "@/components/skills/skill-markdown-layout"
import { PageHeader } from "@/components/shell/page-header"
import { MarkdownContent } from "@/components/session/markdown-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import {
  deleteSkill,
  isCustomSkill,
  listSkills,
  type ApiSkill,
} from "@/lib/api/skills"
import { buildSkillMarkdown, getRequiredIntegrations } from "@/lib/skills/skill-markdown"

type SkillDetailViewProps = {
  skillId: string
}

export function SkillDetailView({ skillId }: SkillDetailViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { canManageSkills } = useWorkspacePermissions()
  const [skill, setSkill] = useState<ApiSkill | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const loadSkill = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const items = await listSkills(token)
      const match = items.find((entry) => entry.id === skillId) ?? null
      setSkill(match)
    } catch (err) {
      setSkill(null)
      toast.error("Could not load skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, skillId])

  useEffect(() => {
    void loadSkill()
  }, [loadSkill])

  const markdown = useMemo(() => (skill ? buildSkillMarkdown(skill) : ""), [skill])

  async function handleDelete() {
    if (!skill || !isCustomSkill(skill) || !canManageSkills) return
    if (!window.confirm(`Delete custom skill "${skill.name}"?`)) return

    setDeleting(true)
    try {
      const token = await getToken()
      await deleteSkill(token, skill.id)
      toast.success("Skill deleted")
      router.push("/skills")
    } catch (err) {
      toast.error("Could not delete skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <PageHeader
          title="Skills"
          icon={RiBookOpenLine}
          showSearch={false}
          breadcrumbs={[{ label: "Skills", href: "/skills" }, { label: "Loading…" }]}
        />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <PageHeader
          title="Skills"
          icon={RiBookOpenLine}
          showSearch={false}
          breadcrumbs={[{ label: "Skills", href: "/skills" }, { label: "Not found" }]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">This skill could not be found.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/skills">
              <RiArrowLeftLine className="size-3.5" />
              Back to skills
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const custom = isCustomSkill(skill)
  const integrations = getRequiredIntegrations(skill)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={skill.name}
        description={skill.category}
        icon={RiBookOpenLine}
        showSearch={false}
        breadcrumbs={[
          { label: "Skills", href: "/skills" },
          { label: skill.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/skills">
                <RiArrowLeftLine className="size-3.5" />
                Back
              </Link>
            </Button>
            {custom && canManageSkills ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive"
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? <Spinner className="size-3.5" /> : "Delete skill"}
              </Button>
            ) : null}
          </div>
        }
      />

      <SkillMarkdownLayout>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant={custom ? "default" : "outline"}>
            {custom ? "Custom" : "Core"}
          </Badge>
          {skill.category ? (
            <Badge variant="outline" className="font-normal">
              {skill.category}
            </Badge>
          ) : null}
          {integrations.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              Requires {integrations.join(", ")}
            </span>
          ) : null}
        </div>

        <MarkdownContent markdown={markdown} />
      </SkillMarkdownLayout>
    </div>
  )
}
