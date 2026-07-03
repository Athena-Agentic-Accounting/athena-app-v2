"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RiArrowLeftLine, RiBookOpenLine, RiPencilLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillDetailCard } from "@/components/skills/skill-detail-card"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import {
  deleteSkill,
  getSkill,
  isCustomSkill,
  type ApiSkill,
} from "@/lib/api/skills"

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
      const item = await getSkill(token, skillId)
      setSkill(item)
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
  const customisable = isCustomisableSkill(skill)

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
            {canManageSkills ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/skills/${skill.id}/edit`}>
                  <RiPencilLine className="size-3.5" />
                  Edit
                </Link>
              </Button>
            ) : null}
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

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        <div className="w-full max-w-3xl">
          <SkillDetailCard skill={skill} />
          {!custom && customisable ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Core skills are read-only templates. Customise by copying into your firm&apos;s
              library when that flow is available.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
