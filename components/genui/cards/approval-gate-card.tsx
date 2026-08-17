"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { toast } from "sonner"

import { GenUITable } from "@/components/genui/genui-table"
import { JournalEntryCardBody } from "@/components/genui/cards/journal-entry-card"
import { CardShell } from "@/components/genui/card-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { decideApproval } from "@/lib/api/approvals"
import {
  extractJournalEntriesFromPayload,
  journalEntryFromPendingAction,
  KNOWN_GATE_TYPES,
  normalizeGateType,
} from "@/lib/genui/gate-types"
import type {
  ApprovalDecision,
  ApprovalDecisionRecord,
  ApprovalGateCardData,
  JournalEntryReviewData,
} from "@/lib/genui/types"

type ApprovalGateCardProps = {
  data: ApprovalGateCardData
  activityId: string
  canDecide?: boolean
  decision?: ApprovalDecisionRecord
  onDecision?: (
    gateId: string,
    payload: {
      decision: ApprovalDecision
      notes?: string
      editedPayload?: Record<string, unknown>
    },
  ) => Promise<void> | void
}

function GenericPayloadList({ payload }: { payload: Record<string, unknown> }) {
  // Check if payload contains an inner journal entry structure before dumping
  const extracted = extractJournalEntriesFromPayload(payload)
  if (extracted.length > 0) {
    return (
      <div className="space-y-4">
        {extracted.map((entry, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 p-3 bg-muted/20">
            {entry.memo || entry.title ? (
              <div className="mb-2 text-xs font-semibold text-foreground">
                {entry.memo ?? entry.title}
                {entry.reversing ? (
                  <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 font-normal">
                    Auto-Reverses ({entry.reversalDate ?? "next month"})
                  </span>
                ) : null}
              </div>
            ) : null}
            <JournalEntryCardBody data={entry} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <dl className="space-y-2 pl-2 text-sm">
      {Object.entries(payload).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[140px_1fr] gap-2">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="text-foreground">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function resolveJournalEntries(data: ApprovalGateCardData): JournalEntryReviewData[] {
  // 1. Try extracting from payload (supports multiple entries)
  const fromPayload = extractJournalEntriesFromPayload(data.payload)
  if (fromPayload.length > 0) return fromPayload

  // 2. Try extracting from pendingAction args
  if (data.pendingAction?.args) {
    const fromAction = extractJournalEntriesFromPayload(data.pendingAction.args)
    if (fromAction.length > 0) return fromAction

    const qbEntry = journalEntryFromPendingAction(data.pendingAction.args)
    if (qbEntry) return [qbEntry]
  }

  return []
}

function renderPayload(data: ApprovalGateCardData) {
  const gateType = normalizeGateType(data.gateType)
  const { payload } = data

  const journalEntries = resolveJournalEntries(data)
  if (gateType === "journal_entry" || journalEntries.length > 0) {
    if (journalEntries.length > 0) {
      return (
        <div className="space-y-4">
          {journalEntries.map((entry, idx) => (
            <div key={idx} className="rounded-lg border border-border/60 p-3 bg-muted/20">
              {entry.memo || entry.title ? (
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>{entry.memo ?? entry.title}</span>
                  {entry.reversing ? (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 font-normal">
                      Auto-Reverses ({entry.reversalDate ?? "next month"})
                    </span>
                  ) : null}
                </div>
              ) : null}
              <JournalEntryCardBody data={entry} />
            </div>
          ))}
        </div>
      )
    }
  }

  if (gateType === "transaction_categorization" && Array.isArray(payload.transactions)) {
    const rows = payload.transactions as Array<{
      id?: string
      description?: string
      amount?: number
      suggestedAccount?: string
    }>
    return (
      <GenUITable
        columns={[
          { key: "description", label: "Description", format: "text" },
          { key: "amount", label: "Amount", align: "left", format: "currency" },
          { key: "suggestedAccount", label: "Suggested account", format: "text" },
        ]}
        rows={rows.map((row, index) => ({
          description: row.description ?? "—",
          amount: row.amount,
          suggestedAccount: row.suggestedAccount ?? "—",
          id: row.id ?? index,
        }))}
      />
    )
  }

  if (gateType === "invoice_create" || gateType === "bill_create") {
    return <GenericPayloadList payload={payload} />
  }

  if (process.env.NODE_ENV !== "production" && !KNOWN_GATE_TYPES.has(gateType)) {
    console.warn(`[ApprovalGateCard] Unmapped gateType: ${data.gateType}`)
  }

  return <GenericPayloadList payload={payload} />
}

function resolveJournalEntryData(data: ApprovalGateCardData): JournalEntryReviewData | null {
  const entries = resolveJournalEntries(data)
  return entries.length > 0 ? entries[0] : null
}

export function ApprovalGateCard({
  data,
  activityId,
  canDecide = true,
  decision,
  onDecision,
}: ApprovalGateCardProps) {
  const { getToken } = useAuth()
  const [localDecision, setLocalDecision] = useState<ApprovalDecisionRecord | undefined>(decision)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const journalEntryData = useMemo(() => resolveJournalEntryData(data), [data])
  const [editedLines, setEditedLines] = useState<JournalEntryReviewData["lines"]>(
    journalEntryData?.lines ?? [],
  )

  const resolvedDecision =
    localDecision ??
    decision ??
    (data.status === "approved" || data.status === "resolved"
      ? {
          decision: "approve" as const,
          decidedBy: "You",
          decidedAt: "Approved",
        }
      : data.status === "rejected"
        ? {
            decision: "reject" as const,
            decidedBy: "You",
            decidedAt: "Rejected",
          }
        : undefined)

  async function submitDecision(
    nextDecision: ApprovalDecision,
    options?: { notes?: string; editedPayload?: Record<string, unknown> },
  ) {
    if (!canDecide) return

    setSubmitting(true)
    try {
      if (onDecision) {
        await onDecision(data.gateId ?? `${activityId}-gate`, {
          decision: nextDecision,
          notes: options?.notes,
          editedPayload: options?.editedPayload,
        })
      } else if (data.gateId) {
        const token = await getToken()
        await decideApproval(token, data.gateId, {
          decision: nextDecision,
          notes: options?.notes,
          editedPayload: options?.editedPayload,
        })
      }

      setLocalDecision({
        decision: nextDecision,
        decidedBy: "You",
        decidedAt: new Date().toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
        notes: options?.notes,
      })
      setRejectOpen(false)
      setEditOpen(false)
      toast.success(
        nextDecision === "approve"
          ? "Approval recorded"
          : nextDecision === "reject"
            ? "Rejection recorded"
            : "Edited approval recorded",
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      if (msg.toLowerCase().includes("already resolved") || msg.toLowerCase().includes("approved")) {
        setLocalDecision({
          decision: "approve",
          decidedBy: "You",
          decidedAt: new Date().toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }),
        })
        setRejectOpen(false)
        setEditOpen(false)
        toast.info("Gate already resolved as Approved")
        return
      }
      toast.error("Could not record decision", {
        description: msg,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const editJournalPayload = useMemo(() => {
    if (!journalEntryData) return null
    return { ...journalEntryData, lines: editedLines }
  }, [journalEntryData, editedLines])

  if (resolvedDecision) {
    const approved = resolvedDecision.decision !== "reject"
    return (
      <CardShell type="approval_gate" title={data.title}>
        <p className={approved ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {approved ? <RiCheckLine className="mr-1 inline size-4" /> : <RiCloseLine className="mr-1 inline size-4" />}
          {resolvedDecision.decision === "approve"
            ? "Approved"
            : resolvedDecision.decision === "edit"
              ? "Approved with edits"
              : "Rejected"}
          {resolvedDecision.decidedBy ? ` by ${resolvedDecision.decidedBy}` : ""}
          {resolvedDecision.decidedAt ? ` · ${resolvedDecision.decidedAt}` : ""}
        </p>
        {resolvedDecision.notes ? (
          <p className="mt-2 text-sm text-muted-foreground">{resolvedDecision.notes}</p>
        ) : null}
      </CardShell>
    )
  }

  return (
    <CardShell type="approval_gate" title={data.title}>
      <div className="space-y-4">
        {editOpen && editJournalPayload ? (
          <JournalEntryCardBody
            data={editJournalPayload}
            editable
            editedLines={editedLines}
            onLineChange={(index, patch) =>
              setEditedLines((current: JournalEntryReviewData["lines"]) =>
                current.map((line, lineIndex) =>
                  lineIndex === index ? { ...line, ...patch } : line,
                ),
              )
            }
          />
        ) : (
          renderPayload(data)
        )}

        <p className="text-xs text-muted-foreground">
          Target: {data.pendingAction.target}
        </p>

        {canDecide ? (
          <div className="space-y-3">
            {rejectOpen ? (
              <div className="space-y-2">
                <Input
                  value={rejectNotes}
                  onChange={(event) => setRejectNotes(event.target.value)}
                  placeholder="Reason for rejection"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={submitting || !rejectNotes.trim()}
                    onClick={() => void submitDecision("reject", { notes: rejectNotes.trim() })}
                  >
                    {submitting ? <Spinner className="size-3.5" /> : "Submit rejection"}
                  </Button>
                </div>
              </div>
            ) : null}

            {!rejectOpen ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={submitting}
                  onClick={() => void submitDecision("approve")}
                >
                  {submitting ? <Spinner className="size-3.5" /> : "Approve"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => {
                    if (editOpen) {
                      setEditOpen(false)
                      return
                    }
                    setEditOpen(true)
                  }}
                >
                  {editOpen ? "Cancel edit" : "Edit"}
                </Button>
                {editOpen ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting}
                    onClick={() =>
                      void submitDecision("edit", {
                        editedPayload: editJournalPayload ?? data.payload,
                      })
                    }
                  >
                    Submit edit
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </CardShell>
  )
}
