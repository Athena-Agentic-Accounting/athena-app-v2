"use client"

import type { FormEvent } from "react"
import { MailIcon, UserIcon } from "lucide-react"

import { AuthStepPanel } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type AuthEmailStepProps = {
  email: string
  onEmailChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  error: string | null
}

function AuthIconHeader() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative flex size-[68px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl lg:size-20",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-10",
        )}
      >
        <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-inset ring-border shadow-xs lg:size-14">
          <UserIcon className="size-6 text-primary lg:size-7" />
        </div>
      </div>
    </div>
  )
}

export function AuthEmailStep({
  email,
  onEmailChange,
  onSubmit,
  loading,
  error,
}: AuthEmailStepProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (email.trim()) onSubmit()
  }

  return (
    <>
      <AuthIconHeader />
      <AuthStepPanel
        title="Sign in with email"
        description="Please enter your credentials to access your account."
      >
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="auth-email">
                Work email <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@institution.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={loading}
                  autoFocus
                  required
                  aria-invalid={Boolean(error)}
                  className="pl-9"
                />
              </div>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Sending code…
                </>
              ) : (
                "Continue with email"
              )}
            </Button>
          </FieldGroup>
        </form>
      </AuthStepPanel>
    </>
  )
}
