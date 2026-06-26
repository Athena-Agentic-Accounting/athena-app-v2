import { Suspense } from "react"

import { AuthFlow } from "@/components/auth/auth-flow"
import { Spinner } from "@/components/ui/spinner"

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-sm text-muted-foreground">
      <Spinner className="size-8" />
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthFlow />
    </Suspense>
  )
}
