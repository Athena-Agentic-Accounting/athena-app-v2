import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { RequireActiveOrg } from "@/components/auth/require-active-org"
import { InstitutionOnboarding } from "@/components/onboarding/institution-onboarding"
import { getAthenaMetadata } from "@/lib/athena/user-metadata"

function sanitizeReturnPath(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (
    v &&
    v.startsWith("/") &&
    !v.startsWith("//") &&
    v !== "/auth" &&
    v !== "/onboarding"
  ) {
    return v
  }
  return "/board"
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/auth")
  }

  const user = await currentUser()
  const meta = getAthenaMetadata(
    user?.unsafeMetadata as Record<string, unknown> | undefined
  )
  const sp = await searchParams
  const returnPath = sanitizeReturnPath(sp.next)

  if (meta?.onboardingComplete) {
    redirect(returnPath)
  }

  return (
    <RequireActiveOrg>
      <InstitutionOnboarding returnPath={returnPath} />
    </RequireActiveOrg>
  )
}
