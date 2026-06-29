import { handleOAuthCallbackRequest } from "@/lib/integrations/oauth-callback-server"

/** Legacy redirect URI — forwards to the engine-aligned callback path. */
export async function GET(request: Request) {
  return handleOAuthCallbackRequest(request, "google-drive")
}
