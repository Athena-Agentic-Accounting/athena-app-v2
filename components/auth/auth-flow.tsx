"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useSignIn } from "@clerk/nextjs"

import { AuthShell, AuthLogo } from "@/components/auth/auth-shell"
import { AuthEmailStep } from "@/components/auth/auth-email-step"
import { AuthCodeStep } from "@/components/auth/auth-code-step"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type Step = "email" | "code"

function clerkFirstError(err: unknown): string {
  if (err && typeof err === "object") {
    if ("errors" in err) {
      const errors = (err as { errors?: { longMessage?: string; message?: string }[] })
        .errors
      const first = errors?.[0]
      if (first?.longMessage) return first.longMessage
      if (first?.message) return first.message
    }
    if ("message" in err && typeof (err as { message?: string }).message === "string") {
      return (err as { message: string }).message
    }
  }
  if (err instanceof Error) return err.message
  return "Something went wrong. Please try again."
}

export function AuthFlow() {
  const auth = useAuth()
  const { signIn } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()

  const postAuthPath = useMemo(() => {
    const from = searchParams.get("from")
    if (from && from.startsWith("/") && !from.startsWith("//")) return from
    return "/board"
  }, [searchParams])

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSignIn = auth.isLoaded ? signIn ?? undefined : undefined

  useEffect(() => {
    if (auth.isLoaded && auth.isSignedIn) {
      router.replace(postAuthPath)
    }
  }, [auth.isLoaded, auth.isSignedIn, postAuthPath, router])

  const startEmailCode = useCallback(async () => {
    if (!activeSignIn) return
    setError(null)
    setLoading(true)
    try {
      const future = activeSignIn

      try {
        await future.create({
          identifier: email.trim(),
        })
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "errors" in err &&
          Array.isArray((err as { errors: unknown[] }).errors)
        ) {
          const errors = (err as { errors: { code?: string }[] }).errors
          if (errors?.[0]?.code === "session_exists") {
            router.replace(postAuthPath)
            return
          }
        }
        setError(
          clerkFirstError(err) ||
          "No account found for this email, or sign-in is unavailable."
        )
        return
      }

      if (activeSignIn.status !== "needs_first_factor") {
        setError("Unexpected sign-in state. Please contact support.")
        return
      }

      const emailFactor = activeSignIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      ) as { emailAddressId?: string } | undefined

      const sendParams = emailFactor?.emailAddressId
        ? { emailAddressId: emailFactor.emailAddressId }
        : { emailAddress: email.trim() }

      let sendError: unknown = null
      try {
        await future.emailCode.sendCode(sendParams)
      } catch (err: unknown) {
        sendError = err
      }

      if (sendError) {
        setError(
          clerkFirstError(sendError) ||
          "Could not send a code to this address. Try again."
        )
        return
      }

      setStep("code")
    } catch (err: unknown) {
      setError(
        clerkFirstError(err) ||
        "No account found for this email, or sign-in is unavailable."
      )
    } finally {
      setLoading(false)
    }
  }, [email, activeSignIn, router, postAuthPath])

  const resendCode = useCallback(async () => {
    if (!activeSignIn) return
    setError(null)
    setLoading(true)
    try {
      const emailFactor = activeSignIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      ) as { emailAddressId?: string } | undefined

      const sendParams = emailFactor?.emailAddressId
        ? { emailAddressId: emailFactor.emailAddressId }
        : { emailAddress: email.trim() }

      await activeSignIn.emailCode.sendCode(sendParams)
    } catch (err: unknown) {
      setError(
        clerkFirstError(err) ||
          "Could not send a new code. Try again in a moment."
      )
    } finally {
      setLoading(false)
    }
  }, [email, activeSignIn])

  const verifyCode = useCallback(
    async (code: string) => {
      if (!activeSignIn) return
      setError(null)
      setLoading(true)
      try {
        const future = activeSignIn

        const { error: verifyError } = await future.emailCode.verifyCode({
          code,
        })

        if (verifyError) {
          setError(clerkFirstError(verifyError) || "Invalid or expired code.")
          return
        }

        if (activeSignIn.status !== "complete") {
          setError("Verification incomplete. Request a new code and try again.")
          return
        }

        const { error: finalizeError } = await future.finalize()

        if (finalizeError) {
          setError(clerkFirstError(finalizeError) || "Could not start session.")
          return
        }

        const q = `?next=${encodeURIComponent(postAuthPath)}`
        router.replace(`/onboarding${q}`)
        router.refresh()
      } catch (err) {
        setError(clerkFirstError(err) || "Invalid or expired code.")
      } finally {
        setLoading(false)
      }
    },
    [postAuthPath, router, activeSignIn]
  )

  const goBackToEmail = useCallback(() => {
    setStep("email")
    setError(null)
  }, [])

  const authHeader =
    step === "code"
      ? (
          <Button
            variant="link"
            type="button"
            onClick={goBackToEmail}
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
          >
            Back to email
          </Button>
        )
      : (
          <AuthLogo />
        )

  if (!auth.isLoaded || auth.isSignedIn) {
    return (
      <AuthShell>
        <div
          className="flex w-full items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-label={auth.isSignedIn ? "Redirecting" : "Loading"}
        >
          <Spinner />
        </div>
      </AuthShell>
    )
  }

  if (!signIn) {
    return (
      <AuthShell>
        <p className="text-center text-sm text-muted-foreground">
          Sign-in is temporarily unavailable. Refresh the page or try again in a
          few moments.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      header={authHeader}
      footer={
        <span>
          By continuing you agree to your institution&apos;s policies and
          LUCA&apos;s acceptable use.
        </span>
      }
    >
      {step === "email" ? (
        <AuthEmailStep
          email={email}
          onEmailChange={setEmail}
          onSubmit={startEmailCode}
          loading={loading}
          error={error}
        />
      ) : (
        <AuthCodeStep
          email={email}
          onCodeComplete={verifyCode}
          onResend={resendCode}
          loading={loading}
          error={error}
        />
      )}
    </AuthShell>
  )
}
