"use client"

import { useState } from "react"
import { MailCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type AuthCodeStepProps = {
  email: string
  onCodeComplete: (code: string) => void
  onResend: () => void
  loading: boolean
  error: string | null
}

export function AuthCodeStep({
  email,
  onCodeComplete,
  onResend,
  loading,
  error,
}: AuthCodeStepProps) {
  const [value, setValue] = useState("")

  return (
    <section className="flex w-full flex-col items-center gap-6">
      <div
        className={cn(
          "relative flex size-[68px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl lg:size-20",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-10",
        )}
      >
        <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-background shadow-xs ring-1 ring-inset ring-border lg:size-14">
          <MailCheckIcon className="size-6 text-primary lg:size-7" />
        </div>
      </div>

      <div className="w-full flex flex-col gap-2 text-center">
        <h1 className="text-lg font-normal text-foreground lg:text-xl">
          Enter verification code
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a 6-digit code to{" "}
          <span className="font-normal text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={setValue}
          disabled={loading}
          aria-invalid={Boolean(error)}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error ? (
          <FieldError className="text-center">{error}</FieldError>
        ) : null}

        <Button
          className="w-full"
          disabled={loading || value.length !== 6}
          onClick={() => onCodeComplete(value)}
        >
          {loading ? (
            <>
              <Spinner data-icon="inline-start" />
              Verifying…
            </>
          ) : (
            "Verify and continue"
          )}
        </Button>
      </div>

      <div className="flex w-full flex-col items-center gap-1 text-center">
        <span className="text-sm text-muted-foreground">
          Experiencing issues receiving the code?
        </span>
        <Button
          variant="link"
          type="button"
          disabled={loading}
          onClick={onResend}
        >
          Resend code
        </Button>
      </div>
    </section>
  )
}
