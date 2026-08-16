import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth(.*)",
  "/api/auth(.*)",
  "/api/connections/(.*)/callback",
  "/api/integrations/(.*)/callback",
  "/integrations/callback(.*)",
  "/settings/connections(.*)",
  "/demo(.*)",
  "/home(.*)",
  "/board(.*)",
  "/activities(.*)",
  "/clients(.*)",
  "/skills(.*)",
  "/schedules(.*)",
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
