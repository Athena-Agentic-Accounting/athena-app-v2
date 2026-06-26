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

function isJournalEntryPayload(payload: Record<string, unknown>): payload is JournalEntryReviewData {
  return Array.isArray(payload.lines) && typeof payload.date === "string"
}

function GenericPayloadList({ payload }: { payload: Record<string, unknown> }) {
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

function renderPayload(data: ApprovalGateCardData) {
  const { gateType, payload } = data

  if (gateType === "journal_entry" && isJournalEntryPayload(payload)) {
    return <JournalEntryCardBody data={payload} />
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

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[ApprovalGateCard] Unmapped gateType: ${gateType}`)
  }

  return <GenericPayloadList payload={payload} />
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
  const [editedPayload, setEditedPayload] = useState<Record<string, unknown>>(data.payload)
  const [editedLines, setEditedLines] = useState<JournalEntryReviewData["lines"]>(
    isJournalEntryPayload(data.payload) ? data.payload.lines : [],
  )

  const resolvedDecision = localDecision ?? decision

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
      toast.error("Could not record decision", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const editJournalPayload = useMemo(() => {
    if (!isJournalEntryPayload(data.payload)) return null
    return { ...data.payload, lines: editedLines }
  }, [data.payload, editedLines])

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
              setEditedLines((current) =>
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
                        editedPayload: editJournalPayload ?? editedPayload,
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
