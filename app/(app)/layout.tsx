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
  if (!userId) redirect("/auth")

  const user = await currentUser()
  const meta = getAthenaMetadata(
    user?.unsafeMetadata as Record<string, unknown> | undefined,
  )
  if (!meta?.onboardingComplete) redirect("/onboarding")

  return (
    <RequireActiveOrg>
      <AppShell>{children}</AppShell>
    </RequireActiveOrg>
  )
}
