"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { RiAddLine, RiArrowRightSLine, RiBookOpenLine, RiSearchLine } from "@remixicon/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { isCustomSkill, listSkills, type ApiSkill } from "@/lib/api/skills"
import { getRequiredIntegrations } from "@/lib/skills/skill-markdown"
import { cn } from "@/lib/utils"

type SkillsTab = "all" | "core" | "custom"

const TAB_OPTIONS: { id: SkillsTab; label: string }[] = [
  { id: "all", label: "All skills" },
  { id: "core", label: "Core library" },
  { id: "custom", label: "Custom skills" },
]

export function SkillsView() {
  const { getToken } = useAuth()
  const { canManageSkills } = useWorkspacePermissions()
  const [skills, setSkills] = useState<ApiSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SkillsTab>("all")
  const [searchQuery, setSearchQuery] = useState("")

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

  const visibleSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return skills.filter((skill) => {
      const custom = isCustomSkill(skill)
      if (activeTab === "core" && custom) return false
      if (activeTab === "custom" && !custom) return false

      if (!query) return true

      const haystack = [
        skill.name,
        skill.category,
        skill.description,
        skill.sourceText ?? skill.source_text,
        ...getRequiredIntegrations(skill),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [activeTab, searchQuery, skills])

  const tabTitle =
    activeTab === "all"
      ? "All skills"
      : activeTab === "core"
        ? "Core library"
        : "Custom skills"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Skills"
        description="Core library and your firm's custom workflows"
        icon={RiBookOpenLine}
        showSearch={false}
        actionLabel={canManageSkills ? "Create skill" : undefined}
        actionHref={canManageSkills ? "/skills/new" : undefined}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg bg-muted/70 p-1 ring-1 ring-inset ring-border/50">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 sm:w-72">
              <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search skills..."
                className="h-9 bg-background pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-medium text-foreground">{tabTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "custom"
                ? "Workflows your firm created. Open any skill to read the full Markdown document."
                : activeTab === "core"
                  ? "Built-in skills shipped with Athena. These are read-only."
                  : "Browse the core library plus your firm's custom skills."}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          ) : visibleSkills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {activeTab === "custom"
                  ? "No custom skills yet."
                  : "No skills match your search."}
              </p>
              {activeTab === "custom" && canManageSkills ? (
                <Button size="sm" className="mt-4 gap-1.5" asChild>
                  <Link href="/skills/new">
                    <RiAddLine className="size-3.5" />
                    Create your first skill
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card ring-1 ring-foreground/5">
              {visibleSkills.map((skill, index) => {
                const custom = isCustomSkill(skill)
                const integrations = getRequiredIntegrations(skill)

                return (
                  <article key={skill.id}>
                    {index > 0 ? <div className="border-t border-border/60" /> : null}
                    <Link
                      href={`/skills/${skill.id}`}
                      className="group flex items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground group-hover:underline">
                            {skill.name}
                          </h3>
                          <Badge variant={custom ? "default" : "outline"}>
                            {custom ? "Custom" : "Core"}
                          </Badge>
                          {skill.category ? (
                            <Badge variant="outline" className="font-normal">
                              {skill.category}
                            </Badge>
                          ) : null}
                        </div>
                        {skill.description ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {skill.description}
                          </p>
                        ) : null}
                        {integrations.length > 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Requires: {integrations.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <RiArrowRightSLine className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
