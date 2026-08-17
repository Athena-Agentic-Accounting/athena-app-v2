import type { ActivityStreamEvent } from "@/lib/genui/types"
import type { SessionArtifact } from "@/lib/session/types"

export function buildArtifactFromStreamEvents(
  events: ActivityStreamEvent[],
  activityPlan?: any[],
): SessionArtifact | undefined {
  // Plan checklist emitted by the AI server after plan submission
  const planChecklist = events.find(
    (event) =>
      event.event.type === "checklist" &&
      /plan/i.test(event.event.data.title ?? ""),
  )

  const planNarrative = events.find(
    (event) =>
      event.event.type === "narrative" &&
      /plan/i.test(event.event.data.title ?? event.event.data.markdown.slice(0, 40)),
  )

  const planTable = events.find(
    (event) =>
      event.event.type === "table" &&
      (/plan|fixed asset|register|schedule/i.test(event.event.data.title ?? "") ||
        planNarrative !== undefined),
  )

  if (!planChecklist && !planNarrative && !planTable && (!activityPlan || activityPlan.length === 0)) return undefined

  // Build markdown from checklist items if no narrative is present
  let markdown: string
  if (planNarrative?.event.type === "narrative") {
    markdown = planNarrative.event.data.markdown
  } else if (planChecklist?.event.type === "checklist") {
    const items = planChecklist.event.data.items
    const title = planChecklist.event.data.title ?? "Proposed Plan"
    const lines = items.map((item) => `- ${item.label}`)
    markdown = `# ${title}\n\n${lines.join("\n")}`
  } else if (activityPlan && activityPlan.length > 0) {
    const lines = activityPlan.map(
      (step: any) =>
        `### Step ${step.order ?? ""}: ${step.task ?? ""}\n${step.details ?? ""}`
    )
    markdown = `# Proposed Plan\n\n${lines.join("\n\n")}`
  } else {
    markdown = "# Plan\n\nReview the generated plan below."
  }

  const table =
    planTable?.event.type === "table" ? planTable.event.data : undefined

  return {
    activeTabId: "plan",
    planTabId: "plan",
    tabs: [
      {
        kind: "plan_review",
        id: "plan",
        slug: "plan",
        title: "Plan",
        markdown,
        table,
      },
    ],
  }
}


export function extractThoughtsFromStream(events: ActivityStreamEvent[]) {
  return events
    .filter((event) => event.event.type === "progress")
    .map((event) => ({
      id: event.id,
      text:
        event.event.type === "progress"
          ? event.event.data.stepDescription
          : "Working…",
    }))
}
