"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createSkill } from "@/lib/api/skills"

type CreateSkillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateSkillDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSkillDialogProps) {
  const { getToken } = useAuth()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [sourceText, setSourceText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName("")
    setCategory("")
    setDescription("")
    setSourceText("")
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedCategory = category.trim()
    const trimmedSource = sourceText.trim()

    if (!trimmedName || !trimmedCategory) {
      toast.error("Name and category are required.")
      return
    }

    if (!trimmedSource) {
      toast.error("Describe the skill in plain English (source text).")
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      await createSkill(token, {
        name: trimmedName,
        category: trimmedCategory,
        description: description.trim() || undefined,
        sourceText: trimmedSource,
      })
      toast.success("Skill created", { description: trimmedName })
      onOpenChange(false)
      onCreated?.()
    } catch (err) {
      toast.error("Could not create skill", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Create custom skill
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Describe what the skill should do in plain English. Athena turns it into a
              reusable workflow for your firm.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="px-5 py-4">
            <Field>
              <FieldLabel htmlFor="skill-name">Name</FieldLabel>
              <Input
                id="skill-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Fixed asset roll-forward"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="skill-category">Category</FieldLabel>
              <Input
                id="skill-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Close tasks"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="skill-description">Description (optional)</FieldLabel>
              <Input
                id="skill-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Roll forward prior-month schedules and reconcile to GL"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="skill-source">Source text</FieldLabel>
              <textarea
                id="skill-source"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                rows={6}
                placeholder="When running this skill, first ask whether a prior-month schedule exists..."
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner className="size-3.5" /> : "Create skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
