"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { SkillMentionTextarea } from "@/components/skills/skill-mention-textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [skills, setSkills] = useState<ApiSkill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [attachedSkillIds, setAttachedSkillIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isLocked = Boolean(activity?.auditLockedAt)

  useEffect(() => {
    if (!open) return

    setName(activity?.name ?? "")
    setNotes("")
    setAttachedSkillIds(activity?.skillIds ?? [])

    let cancelled = false
    setSkillsLoading(true)

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

    return () => {
      cancelled = true
    }
  }, [activity, getToken, open])

  const attachedSkills = useMemo(
    () =>
      attachedSkillIds
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is ApiSkill => Boolean(skill)),
    [attachedSkillIds, skills],
  )

  async function handleSubmit() {
    if (!activity || isLocked) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Enter a task name.")
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            {isLocked
              ? "This task is completed and locked. Skills and plan can no longer be changed."
              : "Update the task name or attached skills. Type @ to search skills."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-1 py-2">
          <div className="space-y-1.5">
            <label htmlFor="edit-activity-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="edit-activity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLocked}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Skills</p>
            {skillsLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading skills…
              </div>
            ) : (
              <SkillMentionTextarea
                value={notes}
                onChange={setNotes}
                attachedSkillIds={attachedSkillIds}
                onAttachedSkillIdsChange={setAttachedSkillIds}
                skills={skills}
                rows={3}
                placeholder={isLocked ? "Skills are locked" : "Type @ to attach skills…"}
                disabled={isLocked}
              />
            )}
            {!skillsLoading && attachedSkills.length === 0 ? (
              <p className="text-xs text-muted-foreground">No skills attached yet.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting || isLocked} onClick={() => void handleSubmit()}>
            {submitting ? <Spinner className="size-3.5" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
