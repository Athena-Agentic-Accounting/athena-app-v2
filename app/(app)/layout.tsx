import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { RequireActiveOrg } from "@/components/auth/require-active-org"
import { AppShell } from "@/components/shell/app-shell"
import { getAthenaMetadata } from "@/lib/athena/user-metadata"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()
  if (!userId) {
    // Rendering the shell for a signed-out visitor showed app chrome and empty
    // states for data they can't load. Send them to sign in instead.
    redirect("/auth")
  }

  const user = await currentUser()
  const meta = getAthenaMetadata(
    user?.unsafeMetadata as Record<string, unknown> | undefined,
  )
  if (!meta?.onboardingComplete && process.env.NODE_ENV === "production") {
    redirect("/onboarding")
  }

  return (
    <RequireActiveOrg>
      <AppShell>{children}</AppShell>
    </RequireActiveOrg>
  )
}
