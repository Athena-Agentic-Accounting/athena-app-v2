import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse, type NextRequest } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth(.*)",
  // OAuth callbacks are hit by the provider, before any Clerk session exists.
  "/api/connections/(.*)/callback",
  "/api/integrations/(.*)/callback",
  "/integrations/callback(.*)",
  "/demo(.*)",
])

// Older engine builds redirect OAuth results to /settings/connections, which is
// now the connections settings page. Forward those hits (they always carry a
// status param) to the callback UI so popup handoff still works.
function isLegacyOAuthLanding(req: NextRequest): boolean {
  return (
    req.nextUrl.pathname === "/settings/connections" &&
    req.nextUrl.searchParams.has("status")
  )
}

export const proxy = clerkMiddleware(
  async (auth, req) => {
    if (isLegacyOAuthLanding(req)) {
      const callbackUrl = req.nextUrl.clone()
      callbackUrl.pathname = "/integrations/callback"
      return NextResponse.redirect(callbackUrl)
    }

    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  },
  { signInUrl: "/auth", signUpUrl: "/auth" }
)

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}
