import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth(.*)",
  // OAuth callbacks are hit by the provider, before any Clerk session exists.
  "/api/connections/(.*)/callback",
  "/api/integrations/(.*)/callback",
  "/integrations/callback(.*)",
  "/settings/connections(.*)",
  "/demo(.*)",
])

export const proxy = clerkMiddleware(
  async (auth, req) => {
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
