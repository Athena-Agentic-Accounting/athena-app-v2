import { handleOAuthCallbackRequest } from "@/lib/integrations/oauth-callback-server"

export async function GET(request: Request) {
  return handleOAuthCallbackRequest(request, "google-drive")
}
