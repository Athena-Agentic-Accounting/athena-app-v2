"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { RiArrowLeftLine, RiBookOpenLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillForm, type SkillFormValues } from "@/components/skills/skill-form"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { listClients, type ApiClient } from "@/lib/api/clients"
import { getSkill, isCustomSkill, updateSkill, type ApiSkill } from "@/lib/api/skills"
import { getRequiredIntegrations } from "@/lib/skills/skill-markdown"

type SkillEditViewProps = {
  skillId: string
}

export function SkillEditView({ skillId }: SkillEditViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { canManageSkills } = useWorkspacePermissions()
  const [skill, setSkill] = useState<ApiSkill | null>(null)
  const [clients, setClients] = useState<ApiClient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!canManageSkills) {
      router.replace("/skills")
    }
  }, [canManageSkills, router])

  const [loadedSkillId, setLoadedSkillId] = useState(skillId)
  if (loadedSkillId !== skillId) {
    setLoadedSkillId(skillId)
    setLoading(true)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const token = await getToken()
        const [item, clientList] = await Promise.all([
          getSkill(token, skillId),
          listClients(token).catch(() => [] as ApiClient[]),
        ])
        if (cancelled) return
        setSkill(item)
        setClients(clientList)
      } catch (err) {
        if (cancelled) return
        setSkill(null)
        toast.error("Could not load skill", {
          description: err instanceof Error ? err.message : "Something went wrong.",
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken, skillId])

  async function handleSubmit(values: SkillFormValues) {
    if (!skill) return
    setSubmitting(true)
    try {
      const token = await getToken()
      const saved = await updateSkill(token, skill.id, {
        name: values.name,
        category: values.category,
        description: values.description,
        requiredIntegrations: values.requiredIntegrations,
        content: values.content,
        clientId: values.clientId ?? undefined,
      })
      toast.success("Skill saved", { description: values.name })
      router.push(`/skills/${saved.id}`)
    } catch (err) {
      toast.error("Could not save skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
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

  const forkNotice = isCustomSkill(skill)
    ? undefined
    : "This is a core library skill. Saving creates an editable copy for your firm — the original stays unchanged."

  return (
    <SkillForm
      title={`Edit ${skill.name}`}
      description="Edit the Markdown document"
      breadcrumbs={[
        { label: "Skills", href: "/skills" },
        { label: skill.name, href: `/skills/${skill.id}` },
        { label: "Edit" },
      ]}
      submitLabel="Save skill"
      cancelHref={`/skills/${skill.id}`}
      initial={{
        name: skill.name,
        category: skill.category ?? "",
        description: skill.description ?? "",
        requiredIntegrations: getRequiredIntegrations(skill),
        content: skill.content ?? "",
        clientId: skill.clientId ?? skill.client_id ?? null,
      }}
      clients={clients}
      forkNotice={forkNotice}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  )
}
