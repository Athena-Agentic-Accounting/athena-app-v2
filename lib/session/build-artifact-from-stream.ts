import type { ActivityStreamEvent } from "@/lib/genui/types"
import type { SessionArtifact } from "@/lib/session/types"

export function buildArtifactFromStreamEvents(
  events: ActivityStreamEvent[],
): SessionArtifact | undefined {
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

  if (!planNarrative && !planTable) return undefined

  const markdown =
    planNarrative?.event.type === "narrative"
      ? planNarrative.event.data.markdown
      : "# Plan\n\nReview the generated plan below."

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
