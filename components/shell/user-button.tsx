"use client"

import { useClerk, useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

export function UserButton() {
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <div className="flex items-center gap-3">
      {user?.primaryEmailAddress?.emailAddress ? (
        <span className="text-sm text-muted-foreground">
          {user.primaryEmailAddress.emailAddress}
        </span>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ redirectUrl: "/auth" })}
      >
        Sign out
      </Button>
    </div>
  )
}
