"use client"

import { useState } from "react"
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
import { createClient } from "@/lib/api/clients"

type CreateClientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateClientDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateClientDialogProps) {
  const { getToken } = useAuth()
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Start from a clean form each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) setName("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Enter a client name.")
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      await createClient(token, trimmed)
      toast.success("Client created", { description: trimmed })
      onOpenChange(false)
      onCreated?.()
    } catch (err) {
      toast.error("Could not create client", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Add client
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Create a new client workspace for integrations, members, and activities.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="px-5 py-4">
            <Field>
              <FieldLabel htmlFor="client-name">Client name</FieldLabel>
              <Input
                id="client-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Corp"
                autoFocus
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating…
                </>
              ) : (
                "Create client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
