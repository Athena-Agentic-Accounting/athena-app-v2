"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { RiAddLine, RiArrowRightSLine, RiBookOpenLine, RiSearchLine } from "@remixicon/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { isCustomSkill, listSkills, type ApiSkill } from "@/lib/api/skills"
import {
  formatIntegrationLabel,
  getRequiredIntegrations,
} from "@/lib/skills/skill-markdown"
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

  useEffect(() => {
    let cancelled = false

    void getToken()
      .then((token) => listSkills(token))
      .then((items) => {
        if (!cancelled) setSkills(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSkills([])
        toast.error("Could not load skills", {
          description: err instanceof Error ? err.message : "Something went wrong.",
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [getToken])

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

  const counts = useMemo(
    () => ({
      all: skills.length,
      core: skills.filter((skill) => !isCustomSkill(skill)).length,
      custom: skills.filter(isCustomSkill).length,
    }),
    [skills],
  )

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

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5 sm:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <div className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full overflow-x-auto" role="tablist" aria-label="Skill library filters">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span className="font-document tabular-nums text-[10px] text-muted-foreground">
                    {counts[tab.id]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative mb-3 min-w-0 sm:w-72">
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
            <h2 className="text-base font-medium tracking-tight text-foreground">{tabTitle}</h2>
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
            <div className="border border-dashed border-border/70 py-16 text-center">
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
            <div className="font-document overflow-hidden border border-border bg-card" data-official-content>
              <div className="hidden grid-cols-[minmax(0,1fr)_9rem_12rem_6rem_1.25rem] gap-4 border-b border-border bg-muted/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid">
                <span>Skill</span>
                <span>Category</span>
                <span>Systems</span>
                <span>Owner</span>
                <span className="sr-only">Open</span>
              </div>
              {visibleSkills.map((skill) => {
                const custom = isCustomSkill(skill)
                const integrations = getRequiredIntegrations(skill)

                return (
                  <article key={skill.id} className="border-b border-border/70 last:border-b-0">
                    <Link
                      href={`/skills/${skill.id}`}
                      className="group grid min-h-20 grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_9rem_12rem_6rem_1.25rem]"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {skill.name}
                        </h3>
                        {skill.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {skill.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted-foreground md:hidden">
                          {[skill.category || "Uncategorised", custom ? "Firm" : "Athena core"].join(" / ")}
                        </p>
                      </div>

                      <span className="hidden truncate text-xs text-foreground/80 md:block">
                        {skill.category || "Uncategorised"}
                      </span>
                      <span className="hidden truncate text-xs text-muted-foreground md:block">
                        {integrations.length > 0
                          ? integrations.map((key) => formatIntegrationLabel(key)).join(", ")
                          : "No external systems"}
                      </span>
                      <span className="hidden text-xs text-muted-foreground md:block">
                        {custom ? "Firm" : "Athena"}
                      </span>

                      <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
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
