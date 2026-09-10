import { backendUpload } from "@/lib/api/backend-client"

/**
 * A file the user attached to a chat prompt. The engine stores it in S3 and
 * returns its row id, which is passed to /api/activities/prompt as `fileIds`
 * so the agent sees the file in its activity context.
 */
export type UploadedAttachment = {
  id: string
  fileName: string
  publicUrl: string
}

/** Extensions the agent can actually parse — see athena-ai parsers/excel.py. */
export const ATTACHMENT_ACCEPT = ".csv,.xlsx,.xls,text/csv"

export async function uploadPromptAttachment(
  token: string | null,
  file: File,
  clientId?: string,
): Promise<UploadedAttachment> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("purpose", "ACTIVITY_ATTACHMENT")
  if (clientId) formData.append("clientId", clientId)

  const result = await backendUpload<{ id: string; publicUrl: string }>(
    "/api/upload/file",
    { token, formData },
  )

  return { id: result.id, fileName: file.name, publicUrl: result.publicUrl }
}
