"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { RiCloseLine } from "@remixicon/react"
import { toast } from "sonner"

import { SkillMentionTextarea } from "@/components/skills/skill-mention-textarea"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ActivityRecord } from "@/lib/activities/types"
import { updateActivity } from "@/lib/api/activities"
import { listSkills, type ApiSkill } from "@/lib/api/skills"

type EditActivityDialogProps = {
  activity: ActivityRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (activity: ActivityRecord) => void
}

export function EditActivityDialog({
  activity,
  open,
  onOpenChange,
  onUpdated,
}: EditActivityDialogProps) {
  const { getToken } = useAuth()
  const nameRef = useRef<HTMLInputElement>(null)
  const [skills, setSkills] = useState<ApiSkill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [name, setName] = useState("")
  const [skillQuery, setSkillQuery] = useState("")
  const [attachedSkillIds, setAttachedSkillIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isLocked = Boolean(activity?.auditLockedAt)

  // Load the activity into the form whenever the dialog opens (or its activity changes).
  const [formSource, setFormSource] = useState<{ open: boolean; activity: typeof activity }>({
    open: false,
    activity: null,
  })
  if (formSource.open !== open || formSource.activity !== activity) {
    setFormSource({ open, activity })
    if (open) {
      setName(activity?.name ?? "")
      setSkillQuery("")
      setAttachedSkillIds(activity?.skillIds ?? [])
      setSkillsLoading(true)
    }
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false

    void (async () => {
      try {
        const token = await getToken()
        const items = await listSkills(token)
        if (!cancelled) setSkills(items)
      } catch {
        if (!cancelled) {
          setSkills([])
          toast.error("Could not load skills")
        }
      } finally {
        if (!cancelled) setSkillsLoading(false)
      }
    })()

    const timer = window.setTimeout(() => nameRef.current?.focus(), 50)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activity, getToken, open])

  const attachedSkills = useMemo(
    () =>
      attachedSkillIds
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is ApiSkill => Boolean(skill)),
    [attachedSkillIds, skills],
  )

  if (!open) return null

  async function handleSubmit() {
    if (!activity || isLocked) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Enter a task name.")
      nameRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const updated = await updateActivity(token, activity.id, {
        name: trimmedName,
        skillIds: attachedSkillIds,
      })
      toast.success("Task updated")
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (err) {
      toast.error("Could not update task", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[10vh] backdrop-blur-[1px]"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-foreground">Edit task</h2>
            <p className="text-xs text-muted-foreground">
              {isLocked
                ? "This task is completed and locked."
                : "Update the task name or attached skills."}
            </p>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        <FieldGroup className="gap-4 px-4 py-4">
          <Field>
            <FieldLabel htmlFor="edit-activity-name">Name</FieldLabel>
            <Input
              ref={nameRef}
              id="edit-activity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLocked}
            />
          </Field>

          <Field>
            <FieldLabel>Skills</FieldLabel>
            {skillsLoading ? (
              <div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading skills…
              </div>
            ) : (
              <SkillMentionTextarea
                value={skillQuery}
                onChange={setSkillQuery}
                attachedSkillIds={attachedSkillIds}
                onAttachedSkillIdsChange={setAttachedSkillIds}
                skills={skills}
                rows={2}
                variant="field"
                showHint={false}
                insertMentionInText={false}
                placeholder={
                  isLocked
                    ? "Skills are locked"
                    : attachedSkills.length > 0
                      ? "Type @ to add another skill"
                      : "Type @ to search skills"
                }
                disabled={isLocked}
              />
            )}
          </Field>
        </FieldGroup>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || isLocked}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Spinner className="size-3.5" /> : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
