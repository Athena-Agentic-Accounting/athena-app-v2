"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { SkillForm, type SkillFormValues } from "@/components/skills/skill-form"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { listClients, type ApiClient } from "@/lib/api/clients"
import { createSkill } from "@/lib/api/skills"

export function SkillCreateView() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { canManageSkills } = useWorkspacePermissions()
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<ApiClient[]>([])

  useEffect(() => {
    if (!canManageSkills) {
      router.replace("/skills")
      return
    }

    let cancelled = false
    void getToken()
      .then((token) => listClients(token))
      .then((items) => {
        if (!cancelled) setClients(items)
      })
      .catch(() => {
        if (!cancelled) setClients([])
      })

    return () => {
      cancelled = true
    }
  }, [canManageSkills, getToken, router])

  async function handleSubmit(values: SkillFormValues) {
    setSubmitting(true)
    try {
      const token = await getToken()
      const created = await createSkill(token, {
        name: values.name,
        category: values.category,
        description: values.description,
        requiredIntegrations: values.requiredIntegrations,
        content: values.content,
        clientId: values.clientId ?? undefined,
      })
      toast.success("Skill created", { description: values.name })
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
    <SkillForm
      title="New skill"
      description="Write your workflow as a Markdown document"
      breadcrumbs={[{ label: "Skills", href: "/skills" }, { label: "New skill" }]}
      submitLabel="Create skill"
      cancelHref="/skills"
      clients={clients}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  )
}
