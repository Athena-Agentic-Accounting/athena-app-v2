import { getCardTitle } from "@/lib/genui/card-meta"
import type { ActivityStreamEvent } from "@/lib/genui/types"
import type { SessionArtifact, SessionArtifactTab } from "@/lib/session/types"

export type SessionOutputStatus = "ready" | "review" | "attention"

export type SessionOutputItem =
  | {
      id: string
      source: "artifact"
      title: string
      category: string
      status: SessionOutputStatus
      tab: SessionArtifactTab
    }
  | {
      id: string
      source: "event"
      title: string
      category: string
      status: SessionOutputStatus
      event: ActivityStreamEvent
    }

export function buildSessionOutputItems(
  artifact: SessionArtifact | undefined,
  events: ActivityStreamEvent[],
): SessionOutputItem[] {
  const items: SessionOutputItem[] =
    artifact?.tabs.map((tab) => ({
      id: `artifact:${tab.id}`,
      source: "artifact" as const,
      title: tab.title || tab.slug || "Workpaper",
      category: tab.kind === "plan_review" ? "Plan" : "Reference document",
      status: tab.kind === "plan_review" ? "review" : "ready",
      tab,
    })) ?? []

  for (const event of getVisibleOutputEvents(events)) {
    const meta = getOutputEventMeta(event)
    items.push({
      id: `event:${event.id}`,
      source: "event",
      event,
      ...meta,
    })
  }

  return items
}

export function enrichOutputEvent(
  selectedEvent: ActivityStreamEvent,
  allEvents: ActivityStreamEvent[],
): ActivityStreamEvent {
  if (selectedEvent.event.type !== "approval_gate") return selectedEvent

  const payload = selectedEvent.event.data.payload ?? {}
  if (payload.lines || payload.journalEntries) return selectedEvent

  const selectedIndex = allEvents.findIndex((event) => event.id === selectedEvent.id)
  const earlierEvents = selectedIndex >= 0 ? allEvents.slice(0, selectedIndex) : allEvents
  const journalEvent = [...earlierEvents]
    .reverse()
    .find((event) => event.event.type === "journal_entry_review")

  if (!journalEvent || journalEvent.event.type !== "journal_entry_review") {
    return selectedEvent
  }

  return {
    ...selectedEvent,
    event: {
      ...selectedEvent.event,
      data: {
        ...selectedEvent.event.data,
        payload: {
          ...payload,
          journalEntries: [journalEvent.event.data],
        },
      },
    },
  }
}

function getVisibleOutputEvents(events: ActivityStreamEvent[]): ActivityStreamEvent[] {
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
  const planSourceIds = new Set(
    [planChecklist?.id, planNarrative?.id, planTable?.id].filter(
      (id): id is string => Boolean(id),
    ),
  )
  const hasApprovalGate = events.some((event) => event.event.type === "approval_gate")

  return events.filter((event, index, all) => {
    if (event.event.type === "progress" || event.event.type === "question_choice") {
      return false
    }

    if (planSourceIds.has(event.id)) return false

    if (event.event.type === "journal_entry_review" && hasApprovalGate) {
      return false
    }

    if (event.event.type === "approval_gate") {
      const gateId = event.event.data.gateId
      const title = event.event.data.title.trim().toLowerCase()
      const lastGateIndex = all.findLastIndex((candidate) => {
        if (candidate.event.type !== "approval_gate") return false
        const candidateGateId = candidate.event.data.gateId
        const candidateTitle = candidate.event.data.title.trim().toLowerCase()
        if (gateId && candidateGateId) return gateId === candidateGateId
        if (title && candidateTitle) return title === candidateTitle
        return !title || !candidateTitle
      })
      return index === lastGateIndex
    }

    if (event.event.type === "file_created") {
      const fileName = (event.event.data.fileName || "").trim().toLowerCase()
      const lastFileIndex = all.findLastIndex((candidate) => {
        if (candidate.event.type !== "file_created") return false
        const candidateName = (candidate.event.data.fileName || "").trim().toLowerCase()
        return fileName && candidateName && fileName === candidateName
      })
      return index === lastFileIndex
    }

    if (event.event.type === "table") {
      const title = (event.event.data.title || "").trim().toLowerCase()
      const lastTableIndex = all.findLastIndex((candidate) => {
        if (candidate.event.type !== "table") return false
        const candidateTitle = (candidate.event.data.title || "").trim().toLowerCase()
        return title && candidateTitle && title === candidateTitle
      })
      return index === lastTableIndex
    }

    if (event.event.type === "narrative") {
      const title = (event.event.data.title || "").trim().toLowerCase()
      if (title) {
        const lastNarrativeIndex = all.findLastIndex((candidate) => {
          if (candidate.event.type !== "narrative") return false
          const candidateTitle = (candidate.event.data.title || "").trim().toLowerCase()
          return candidateTitle === title
        })
        return index === lastNarrativeIndex
      }
    }

    if (event.event.type === "attention_required") {
      const title = (event.event.data.title || "").trim().toLowerCase()
      if (title) {
        const lastAttentionIndex = all.findLastIndex((candidate) => {
          if (candidate.event.type !== "attention_required") return false
          const candidateTitle = (candidate.event.data.title || "").trim().toLowerCase()
          return candidateTitle === title
        })
        return index === lastAttentionIndex
      }
    }

    return true
  })
}

function getOutputEventMeta(event: ActivityStreamEvent): {
  title: string
  category: string
  status: SessionOutputStatus
} {
  switch (event.event.type) {
    case "narrative":
      return {
        title: getCardTitle("narrative", event.event.data.title),
        category: "Analysis",
        status: "ready",
      }
    case "table":
      return {
        title: getCardTitle("table", event.event.data.title),
        category: "Schedule",
        status: "ready",
      }
    case "journal_entry_review":
      return {
        title:
          event.event.data.title?.trim() ||
          `Journal entry — ${event.event.data.date}`,
        category: "Journal entry",
        status: "review",
      }
    case "checklist":
      return {
        title: getCardTitle("checklist", event.event.data.title),
        category: "Checklist",
        status: "ready",
      }
    case "chart":
      return {
        title: getCardTitle("chart", event.event.data.title),
        category: "Analysis",
        status: "ready",
      }
    case "file_created":
      return {
        title: event.event.data.fileName,
        category: "File",
        status: "ready",
      }
    case "attention_required":
      return {
        title: getCardTitle("attention_required", event.event.data.title),
        category: "Exception report",
        status: "attention",
      }
    case "approval_gate":
      return {
        title: event.event.data.title,
        category: "Approval request",
        status:
          event.event.data.status === "approved" ||
          event.event.data.status === "resolved" ||
          event.event.data.status === "rejected"
            ? "ready"
            : "review",
      }
    case "progress":
    case "question_choice":
      throw new Error(`Non-output event cannot be presented as a workpaper: ${event.event.type}`)
  }
}
