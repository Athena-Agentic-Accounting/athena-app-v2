"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

import { Spinner } from "@/components/ui/spinner"

export function RootLoader() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      router.replace("/board")
    } else {
      router.replace("/auth")
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 text-center">
        <div className="inline-block p-6">
          <Spinner className="size-8" />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Preparing your experience
        </p>
      </div>
    </main>
  )
}
