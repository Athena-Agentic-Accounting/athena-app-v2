"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiAddLine, RiBookOpenLine, RiDeleteBinLine } from "@remixicon/react"
import { toast } from "sonner"

import { CreateSkillDialog } from "@/components/knowledge/create-skill-dialog"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { deleteSkill, isCustomSkill, listSkills, type ApiSkill } from "@/lib/api/skills"

export function KnowledgeView() {
  const { getToken } = useAuth()
  const [skills, setSkills] = useState<ApiSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadSkills = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const items = await listSkills(token)
      setSkills(items)
    } catch (err) {
      setSkills([])
      toast.error("Could not load skills", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadSkills()
  }, [loadSkills])

  async function handleDelete(skill: ApiSkill) {
    if (!isCustomSkill(skill)) return
    if (!window.confirm(`Delete custom skill "${skill.name}"?`)) return

    setDeletingId(skill.id)
    try {
      const token = await getToken()
      await deleteSkill(token, skill.id)
      toast.success("Skill deleted")
      await loadSkills()
    } catch (err) {
      toast.error("Could not delete skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Knowledge"
        description="Core library and firm custom skills"
        icon={RiBookOpenLine}
        showSearch={false}
        actionLabel="Create skill"
        onAction={() => setCreateOpen(true)}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : skills.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">No skills found.</p>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <RiAddLine className="size-4" />
              Create your first skill
            </Button>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-4xl gap-3">
            {skills.map((skill) => {
              const custom = isCustomSkill(skill)

              return (
                <article
                  key={skill.id}
                  className="rounded-xl border border-border/70 bg-background p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-foreground">{skill.name}</h2>
                      {skill.category ? (
                        <p className="mt-1 text-xs text-muted-foreground">{skill.category}</p>
                      ) : null}
                      {skill.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                          {skill.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={custom ? "default" : "outline"}>
                        {custom ? "Custom" : "Core"}
                      </Badge>
                      {custom ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="text-destructive"
                          disabled={deletingId === skill.id}
                          aria-label={`Delete ${skill.name}`}
                          onClick={() => void handleDelete(skill)}
                        >
                          {deletingId === skill.id ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <RiDeleteBinLine className="size-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <CreateSkillDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadSkills()}
      />
    </div>
  )
}
